export const FAKE_LATENCY = 300;

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Simula uma chamada de rede: espera `ms` e devolve uma cópia profunda
 * dos dados, como um endpoint HTTP faria. Trocar por fetch() no futuro
 * é substituir só o corpo das funções em src/api/*.
 */
export async function fake<T>(data: T, ms: number = FAKE_LATENCY): Promise<T> {
  await sleep(ms);
  return structuredClone(data);
}
