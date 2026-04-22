/**
 * Extrai segmento [startMs, endMs] com ffmpeg (stream copy; reencode em fallback).
 */

import { spawn } from 'child_process'

function ffmpegBin(): string {
  return process.env.FFMPEG_PATH?.trim() || 'ffmpeg'
}

export function runFfmpeg(args: string[], cwd?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegBin(), args, {
      stdio: ['ignore', 'ignore', 'pipe'],
      windowsHide: true,
      ...(cwd ? { cwd } : {}),
    })
    let err = ''
    child.stderr?.on('data', (c: Buffer) => {
      err += c.toString()
    })
    child.on('error', (e) => reject(e))
    child.on('close', (code) => {
      if (code === 0) resolve()
      else
        reject(
          new Error(
            `ffmpeg exit ${code}: ${err.slice(-800) || 'sem stderr'}`
          )
        )
    })
  })
}

/**
 * Corta vídeo/áudio para MP4 (H.264 + AAC no fallback).
 */
export async function extractClipToMp4(inputPath: string, outputPath: string, startMs: number, endMs: number): Promise<void> {
  if (endMs <= startMs) {
    throw new Error('endMs tem de ser maior que startMs.')
  }

  const startSec = (startMs / 1000).toFixed(3)
  const durationSec = ((endMs - startMs) / 1000).toFixed(3)

  const tryCopy = process.env.FFMPEG_NO_STREAM_COPY !== '1'

  if (tryCopy) {
    try {
      await runFfmpeg([
        '-hide_banner',
        '-loglevel',
        'error',
        '-y',
        '-ss',
        startSec,
        '-i',
        inputPath,
        '-t',
        durationSec,
        '-c',
        'copy',
        '-movflags',
        '+faststart',
        outputPath,
      ])
      return
    } catch {
      // fallback reencode
    }
  }

  await runFfmpeg([
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-ss',
    startSec,
    '-i',
    inputPath,
    '-t',
    durationSec,
    '-c:v',
    'libx264',
    '-preset',
    process.env.FFMPEG_PRESET?.trim() || 'veryfast',
    '-crf',
    process.env.FFMPEG_CRF?.trim() || '23',
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    '-movflags',
    '+faststart',
    outputPath,
  ])
}

/**
 * Queima legendas SRT no vídeo. Ficheiros são basenames relativos a `workDir`.
 */
export async function burnSubtitlesToMp4(options: {
  workDir: string
  inputFile: string
  srtFile: string
  outputFile: string
}): Promise<void> {
  const { workDir, inputFile, srtFile, outputFile } = options
  await runFfmpeg(
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-i',
      inputFile,
      '-vf',
      `subtitles=${srtFile}:charenc=UTF-8`,
      '-c:a',
      'copy',
      outputFile,
    ],
    workDir
  )
}

/**
 * Mux vídeo + áudio opcional (AAC). Ficheiros relativos a workDir.
 */
export async function muxFinalMp4(
  workDir: string,
  videoFile: string,
  audioFile: string | null,
  outputFile: string
): Promise<void> {
  if (audioFile) {
    await runFfmpeg(
      [
        '-hide_banner',
        '-loglevel',
        'error',
        '-y',
        '-i',
        videoFile,
        '-i',
        audioFile,
        '-map',
        '0:v:0',
        '-map',
        '1:a:0',
        '-c:v',
        'copy',
        '-c:a',
        'aac',
        '-b:a',
        '192k',
        '-shortest',
        outputFile,
      ],
      workDir
    )
  } else {
    await runFfmpeg(
      [
        '-hide_banner',
        '-loglevel',
        'error',
        '-y',
        '-i',
        videoFile,
        '-c',
        'copy',
        '-movflags',
        '+faststart',
        outputFile,
      ],
      workDir
    )
  }
}
