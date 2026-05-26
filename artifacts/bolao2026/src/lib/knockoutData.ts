// KNOCKOUT DATA — Estrutura Oficial Copa 2026 (32 Classificados)
// 12 Primeiros, 12 Segundos e 8 Melhores Terceiros.

// Grupos elegíveis para cada confronto de 1º vs 3º (tabela oficial FIFA 2026).
// Restrição: o 3º colocado não pode enfrentar times do próprio grupo.
export const THIRD_ELIGIBLE_GROUPS: Record<string, string[]> = {
  'sr_1': ['C', 'E', 'F', 'H', 'I'],  // 1A vs 3º
  'sr_2': ['E', 'F', 'G', 'I', 'J'],  // 1B vs 3º
  'sr_3': ['B', 'E', 'F', 'I', 'J'],  // 1D vs 3º
  'sr_4': ['A', 'B', 'C', 'D', 'F'],  // 1E vs 3º
  'sr_5': ['A', 'E', 'H', 'I', 'J'],  // 1G vs 3º
  'sr_6': ['C', 'D', 'F', 'G', 'H'],  // 1I vs 3º
  'sr_7': ['D', 'E', 'I', 'J', 'L'],  // 1K vs 3º
  'sr_8': ['E', 'H', 'I', 'J', 'K'],  // 1L vs 3º
};

/**
 * Atribui os 8 melhores terceiros colocados aos confrontos da Fase de 32,
 * respeitando as restrições oficiais da FIFA (495 combinações possíveis).
 * Usa backtracking para encontrar a atribuição válida.
 * @param qualifyingGroups - Lista dos 8 grupos cujos 3ºs colocados avançaram (em ordem de classificação)
 * @returns Mapeamento de slot (sr_1..sr_8) → letra do grupo do 3º colocado, ou null se inválido
 */
export function assignThirdsToMatchups(qualifyingGroups: string[]): Record<string, string> | null {
  const slots = Object.keys(THIRD_ELIGIBLE_GROUPS);
  const result: Record<string, string> = {};
  const used = new Set<string>();

  function backtrack(i: number): boolean {
    if (i === slots.length) return true;
    const slot = slots[i];
    for (const group of THIRD_ELIGIBLE_GROUPS[slot]) {
      if (qualifyingGroups.includes(group) && !used.has(group)) {
        result[slot] = group;
        used.add(group);
        if (backtrack(i + 1)) return true;
        delete result[slot];
        used.delete(group);
      }
    }
    return false;
  }

  return backtrack(0) ? result : null;
}

export const SECOND_ROUND_MATCHUPS = [
  // 8 Jogos: Vencedores de Grupos (A, B, D, E, G, I, K, L) vs Melhores Terceiros
  { id: 'sr_1',  label: '1A × 3º (1)', groupA: 'A', posA: 0, isThirdB: true, thirdIdx: 0 },
  { id: 'sr_2',  label: '1B × 3º (2)', groupA: 'B', posA: 0, isThirdB: true, thirdIdx: 1 },
  { id: 'sr_3',  label: '1D × 3º (3)', groupA: 'D', posA: 0, isThirdB: true, thirdIdx: 2 },
  { id: 'sr_4',  label: '1E × 3º (4)', groupA: 'E', posA: 0, isThirdB: true, thirdIdx: 3 },
  { id: 'sr_5',  label: '1G × 3º (5)', groupA: 'G', posA: 0, isThirdB: true, thirdIdx: 4 },
  { id: 'sr_6',  label: '1I × 3º (6)', groupA: 'I', posA: 0, isThirdB: true, thirdIdx: 5 },
  { id: 'sr_7',  label: '1K × 3º (7)', groupA: 'K', posA: 0, isThirdB: true, thirdIdx: 6 },
  { id: 'sr_8',  label: '1L × 3º (8)', groupA: 'L', posA: 0, isThirdB: true, thirdIdx: 7 },

  // 4 Jogos: Vencedores de Grupos (C, F, H, J) vs Segundos Colocados
  { id: 'sr_9',  label: '1C × 2F', groupA: 'C', posA: 0, groupB: 'F', posB: 1 },
  { id: 'sr_10', label: '1F × 2C', groupA: 'F', posA: 0, groupB: 'C', posB: 1 },
  { id: 'sr_11', label: '1H × 2J', groupA: 'H', posA: 0, groupB: 'J', posB: 1 },
  { id: 'sr_12', label: '1J × 2H', groupA: 'J', posA: 0, groupB: 'H', posB: 1 },

  // 4 Jogos: Restantes Segundos Colocados vs Segundos Colocados
  { id: 'sr_13', label: '2A × 2B', groupA: 'A', posA: 1, groupB: 'B', posB: 1 },
  { id: 'sr_14', label: '2E × 2I', groupA: 'E', posA: 1, groupB: 'I', posB: 1 },
  { id: 'sr_15', label: '2K × 2L', groupA: 'K', posA: 1, groupB: 'L', posB: 1 },
  { id: 'sr_16', label: '2D × 2G', groupA: 'D', posA: 1, groupB: 'G', posB: 1 },
];

export const R16_MATCHUPS = [
  { id: 'r16_1', label: 'OITAVAS 1', sr1: 'sr_1', sr2: 'sr_2' },
  { id: 'r16_2', label: 'OITAVAS 2', sr1: 'sr_3', sr2: 'sr_4' },
  { id: 'r16_3', label: 'OITAVAS 3', sr1: 'sr_5', sr2: 'sr_6' },
  { id: 'r16_4', label: 'OITAVAS 4', sr1: 'sr_7', sr2: 'sr_8' },
  { id: 'r16_5', label: 'OITAVAS 5', sr1: 'sr_9', sr2: 'sr_10' },
  { id: 'r16_6', label: 'OITAVAS 6', sr1: 'sr_11', sr2: 'sr_12' },
  { id: 'r16_7', label: 'OITAVAS 7', sr1: 'sr_13', sr2: 'sr_14' },
  { id: 'r16_8', label: 'OITAVAS 8', sr1: 'sr_15', sr2: 'sr_16' },
];

export const QF_MATCHUPS = [
  { id: 'qf_1', label: 'QUARTAS 1', r16A: 'r16_1', r16B: 'r16_2' },
  { id: 'qf_2', label: 'QUARTAS 2', r16A: 'r16_3', r16B: 'r16_4' },
  { id: 'qf_3', label: 'QUARTAS 3', r16A: 'r16_5', r16B: 'r16_6' },
  { id: 'qf_4', label: 'QUARTAS 4', r16A: 'r16_7', r16B: 'r16_8' },
];

export const SF_MATCHUPS = [
  { id: 'sf_1', label: 'SEMI 1', qfA: 'qf_1', qfB: 'qf_2' },
  { id: 'sf_2', label: 'SEMI 2', qfA: 'qf_3', qfB: 'qf_4' },
];
