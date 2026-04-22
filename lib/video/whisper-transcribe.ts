/**
 * OpenAI Whisper — transcrição de áudio/vídeo (ficheiro).
 */

export type WhisperTranscriptionResult = {
  text: string
  language?: string
  durationSec?: number
}

export async function transcribeWithOpenAIWhisper(input: {
  apiKey: string
  buffer: Buffer
  fileName: string
  mimeType: string
}): Promise<WhisperTranscriptionResult> {
  const model = process.env.WHISPER_MODEL?.trim() || 'whisper-1'

  const form = new FormData()
  const blob = new Blob([new Uint8Array(input.buffer)], { type: input.mimeType })
  form.append('file', blob, input.fileName || 'media.mp4')
  form.append('model', model)
  form.append('response_format', 'verbose_json')

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
    },
    body: form,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(`Whisper API: ${JSON.stringify(err)}`)
  }

  const data = (await res.json()) as {
    text?: string
    language?: string
    duration?: number
  }
  const text = typeof data.text === 'string' ? data.text : ''
  if (!text.trim()) {
    throw new Error('Whisper devolveu texto vazio.')
  }

  return {
    text,
    language: typeof data.language === 'string' ? data.language : undefined,
    durationSec: typeof data.duration === 'number' ? data.duration : undefined,
  }
}
