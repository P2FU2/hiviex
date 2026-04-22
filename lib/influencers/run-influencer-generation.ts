/**
 * Pipeline LLM para jobs de influenciador (identity pack / preview).
 * Sem chave OpenAI (workspace ou env) mantém comportamento mínimo — o worker completa com stub.
 */

import { prisma } from '@/lib/db/prisma'
import { LLMProvider } from '@/lib/llm/providers'
import { getDecryptedWorkspaceApiSecret } from '@/lib/services/workspace-api-secrets'
import { createLogger } from '@/lib/observability/logger'
import type { InfluencerGenerationJobData } from '@/lib/queue/influencer-generation-queue'
import { mergeIdentityPack, parseJsonObjectFromLlm } from '@/lib/influencers/llm-json-parse'

const log = createLogger('influencer-generation')

export type InfluencerGenerationResult = {
  usedLlm: boolean
  outputRef: Record<string, unknown>
}

export async function runInfluencerGeneration(
  data: InfluencerGenerationJobData
): Promise<InfluencerGenerationResult> {
  const { tenantId, influencerId, versionId, jobType } = data

  const version = await prisma.aIInfluencerVersion.findFirst({
    where: { id: versionId, influencerId },
    include: {
      influencer: { select: { id: true, name: true, tenantId: true } },
    },
  })

  if (!version || version.influencer.tenantId !== tenantId) {
    throw new Error('Versão ou influenciador inválido.')
  }

  const apiKey =
    (await getDecryptedWorkspaceApiSecret(tenantId, 'openai')) ||
    process.env.OPENAI_API_KEY?.trim() ||
    null

  const model = process.env.INFLUENCER_LLM_MODEL?.trim() || 'gpt-4o-mini'

  if (!apiKey) {
    log.warn('Sem chave OpenAI (workspace ou OPENAI_API_KEY); a saltar LLM.')
    return {
      usedLlm: false,
      outputRef: {
        message: 'Sem chave OpenAI configurada; configure workspace ou OPENAI_API_KEY.',
        jobType,
        versionId,
      },
    }
  }

  if (jobType === 'INFLUENCER_IDENTITY_PACK') {
    const system = `És um especialista em identidade de criadores/influenciadores para IA.
Responde APENAS com um objeto JSON válido (sem markdown, sem texto extra) que refine o "identity pack":
- Campos sugeridos: summary, visualStyle, tone, audience, taboos (array de strings), hooks (array de strings).
- Valores em português europeu quando fizer sentido.
- Funde com o JSON atual: podes sobrescrever chaves existentes se melhorares o conteúdo.`

    const user = JSON.stringify(
      {
        influencerName: version.influencer.name,
        currentIdentityPack: version.identityPack ?? {},
      },
      null,
      2
    )

    const out = await LLMProvider.call(system, user, {
      provider: 'openai',
      apiKey,
      model,
      temperature: 0.35,
      maxTokens: 2500,
    })

    const patch = parseJsonObjectFromLlm(out.content)
    const merged = mergeIdentityPack(version.identityPack, patch)

    await prisma.aIInfluencerVersion.update({
      where: { id: versionId },
      data: { identityPack: merged as object },
    })

    return {
      usedLlm: true,
      outputRef: {
        jobType,
        versionId,
        model: out.metadata.model,
        tokensUsed: out.metadata.tokensUsed,
        keysUpdated: Object.keys(patch),
      },
    }
  }

  // INFLUENCER_PREVIEW
  const system = `És um copywriter para vídeos curtos. Gera um roteiro breve (gancho + 2–3 bullets + CTA) para um clip de 15–30s.
Responde em português europeu, tom alinhado com a identidade descrita. Sem markdown.`

  const user = `Nome do influenciador: ${version.influencer.name}
Identity pack: ${JSON.stringify(version.identityPack ?? {})}
Blueprint existente: ${version.promptBlueprint ?? '(vazio)'}`

  const out = await LLMProvider.call(system, user, {
    provider: 'openai',
    apiKey,
    model,
    temperature: 0.65,
    maxTokens: 1200,
  })

  const previewText = out.content.trim()
  const mergedBlueprint = version.promptBlueprint
    ? `${version.promptBlueprint.trim()}\n\n--- Preview gerado ---\n${previewText}`
    : `--- Preview gerado ---\n${previewText}`

  await prisma.aIInfluencerVersion.update({
    where: { id: versionId },
    data: { promptBlueprint: mergedBlueprint },
  })

  return {
    usedLlm: true,
    outputRef: {
      jobType,
      versionId,
      model: out.metadata.model,
      tokensUsed: out.metadata.tokensUsed,
      previewChars: previewText.length,
    },
  }
}
