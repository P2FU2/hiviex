/**
 * Referência a modelos com tier gratuito, créditos iniciais ou open-source/self-host.
 * Preços e limites mudam — validar no site de cada fornecedor.
 * O runtime do Hiviex hoje liga OpenAI, Anthropic e Cohere no chat; o resto é orientação.
 */

export type FreeModelKind = 'text' | 'image' | 'audio' | 'video'

export type FreeModelItem = {
  name: string
  /** Notas curtas: tier, limite, self-host, etc. */
  notes: string
  href?: string
}

export type FreeModelCategory = {
  kind: FreeModelKind
  title: string
  /** Frase de contexto (uma linha) */
  blurb: string
  items: FreeModelItem[]
}

export const FREE_TIER_MODEL_REFERENCE: FreeModelCategory[] = [
  {
    kind: 'text',
    title: 'Texto (LLM / chat / conclusão)',
    blurb:
      'Para o chat Hiviex, configure chaves e modelos alinhados ao fornecedor (ex.: gpt-4o-mini com OpenAI).',
    items: [
      {
        name: 'OpenAI — gpt-4o-mini, gpt-3.5-turbo',
        notes:
          'Custo muito baixo por token; contas novas costumam ter crédito inicial. Ideal para testes e produção leve.',
        href: 'https://platform.openai.com/docs/models',
      },
      {
        name: 'Google — Gemini 2.0 Flash / 1.5 Flash',
        notes:
          'Plano Free no Google AI Studio (quotas) para experimentar. Integração no Hiviex depende de suporte a provider «google» no agente.',
        href: 'https://aistudio.google.com/',
      },
      {
        name: 'Groq — Llama 3, Mixtral, etc.',
        notes: 'API rápida com plano gratuito com limites de RPM/TPD (ver site).',
        href: 'https://console.groq.com/',
      },
      {
        name: 'Cohere — command-r+ (trial) / modelos command',
        notes: 'Trial e opções de tier free limitado no dashboard Cohere.',
        href: 'https://cohere.com/',
      },
      {
        name: 'Hugging Face — Inference API',
        notes:
          'Muitos modelos open-weight com tier gratuito limitado; bom para RAG e prototipagem.',
        href: 'https://huggingface.co/inference-api',
      },
    ],
  },
  {
    kind: 'image',
    title: 'Imagem (geração e edição)',
    blurb:
      'Caminhos comuns: APIs com créditos, ou modelos abertos (SDXL, FLUX) em HF Spaces / self-host.',
    items: [
      {
        name: 'Hugging Face — SDXL, FLUX.1 [schnell], Stable Diffusion',
        notes: 'Modelos abertos; Spaces e Inference com quotas gratuitas (filas).',
        href: 'https://huggingface.co/models?pipeline_tag=text-to-image',
      },
      {
        name: 'Bing Image Creator (Microsoft Designer)',
        notes: 'Créditos “Boosts” limitados; motor DALL·E.',
        href: 'https://www.bing.com/images/create',
      },
      {
        name: 'Replicate, fal.ai, etc.',
        notes: 'Créditos iniciais ou pay-per-run baixo; FLUX, SD, controlo net.',
        href: 'https://replicate.com/explore',
      },
    ],
  },
  {
    kind: 'audio',
    title: 'Áudio (voz, música, transcrição)',
    blurb: 'TTS/ASR: cloud com free tier, ou open-source (Whisper local) sem custo de API.',
    items: [
      {
        name: 'OpenAI — Whisper (API)',
        notes: 'Custo por minuto, não “gratuito”, mas muito acessível; alternativa: whisper.cpp local, 0 €.',
        href: 'https://platform.openai.com/docs/models/whisper',
      },
      {
        name: 'whisper.cpp / faster-whisper',
        notes: 'Transcrição offline no teu PC/servidor; modelos abertos.',
        href: 'https://github.com/ggerganov/whisper.cpp',
      },
      {
        name: 'Google Cloud Speech-to-Text (free tier parcial)',
        notes: 'Ver nível gratuito e limites mensais na documentação Google Cloud.',
        href: 'https://cloud.google.com/speech-to-text',
      },
      {
        name: 'Suno, Udio (música generativa)',
        notes: 'Planos com créditos grátis diários/para novos contas; uso casual.',
        href: 'https://suno.ai/',
      },
    ],
  },
  {
    kind: 'video',
    title: 'Vídeo (geração e edição)',
    blurb:
      'Geração realista costuma ser paga; dá para combinar imagens/áudio de tiers free + FFmpeg (sem IA generativa de vídeo).',
    items: [
      {
        name: 'Runway, Pika, Luma, Kling (ofertas e trials)',
        notes: 'Créditos iniciais ou subscrição; útil para clips curtos. Ver princing atual.',
        href: 'https://runwayml.com/',
      },
      {
        name: 'Hugging Face — modelos text-to-video (experimentais)',
        notes: 'Pesquisa e demos; quotas e qualidade variáveis.',
        href: 'https://huggingface.co/models?pipeline_tag=text-to-video',
      },
      {
        name: 'FFmpeg + assets do pipeline Hiviex',
        notes:
          'Sem geração por IA, mas 100% grátis para cortar, juntar e exportar após mídia obtida noutro passo.',
        href: 'https://ffmpeg.org/',
      },
    ],
  },
]
