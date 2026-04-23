import { createHash } from 'node:crypto'

/**
 * BullMQ rejeita `jobId` com ":" (usado internamente em chaves Redis).
 * A chave de idempotência continua no payload `job.data` e na BD;
 * o ID da fila é um derivado determinístico e seguro.
 */
export function idempotencyKeyToBullJobId(idempotencyKey: string): string {
  return `ij-${createHash('sha256').update(idempotencyKey, 'utf8').digest('hex')}`
}
