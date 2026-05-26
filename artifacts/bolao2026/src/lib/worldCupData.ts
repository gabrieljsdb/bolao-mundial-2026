// ============================================================
// WORLD CUP 2026 DATA — Copa do Mundo 2026
// Design: Tactical Board — dark green, Oswald/Bebas Neue
// ============================================================

export type MatchResult = '1' | 'X' | '2'; // Home | Draw | Away

export interface Team {
  id: string;
  name: string;
  shortName: string;
  flag: string;
}

export interface GroupMatch {
  id: string;
  round: 1 | 2 | 3;
  date: string;
  homeTeamId: string;
  awayTeamId: string;
  venue: string;
}

export interface Group {
  id: string;
  name: string;
  teams: string[];
}

export interface MatchPrediction {
  matchId: string;
  result: MatchResult | null;
  homeScore: number | null;
  awayScore: number | null;
}

export interface GroupPrediction {
  groupId: string;
  qualified: [string, string];
  matchPredictions: MatchPrediction[];
}

export interface SimulatorState {
  groupPredictions: Record<string, GroupPrediction>;
  secondRoundPredictions: Record<string, string | null>;
  r16Predictions: Record<string, string | null>;
  qfPredictions: Record<string, string | null>;
  sfPredictions: Record<string, string | null>;
  finalPrediction: string | null;
  finalistPrediction: [string | null, string | null];
  confirmedGroups?: boolean;
  confirmedKnockout?: boolean;
}

export const SCORING = {
  GROUP_WINNER: 6,
  GROUP_HOME_SCORE: 2,
  GROUP_AWAY_SCORE: 2,
  BEST_THIRD: 2,   // Por cada melhor terceiro colocado que você acerta corretamente
  SECOND_ROUND: 1, // Por time que você acerta que vai se classificar na segunda rodada
  R16_ADVANCE: 2,  // Por time que você acerta que vai se classificar nas oitavas
  QF_ADVANCE: 4,   // Por time que você acerta que vai se classificar nas quartas
  SF_ADVANCE: 8,   // Por time que você acerta que vai se classificar na semifinal
  FINALIST: 10,    // Por cada finalista que você acerta corretamente
  CHAMPION: 20,    // Se você acertar o campeão mundial
};

export const TEAMS: Record<string, Team> = {
  MEX: { id: 'MEX', name: 'México', shortName: 'MEX', flag: '🇲🇽' },
  RSA: { id: 'RSA', name: 'África do Sul', shortName: 'RSA', flag: '🇿🇦' },
  KOR: { id: 'KOR', name: 'Coreia do Sul', shortName: 'KOR', flag: '🇰🇷' },
  CZE: { id: 'CZE', name: 'Rep. Tcheca', shortName: 'CZE', flag: '🇨🇿' },

  CAN: { id: 'CAN', name: 'Canadá', shortName: 'CAN', flag: '🇨🇦' },
  BIH: { id: 'BIH', name: 'Bósnia', shortName: 'BIH', flag: '🇧🇦' },
  QAT: { id: 'QAT', name: 'Qatar', shortName: 'QAT', flag: '🇶🇦' },
  SUI: { id: 'SUI', name: 'Suíça', shortName: 'SUI', flag: '🇨🇭' },

  BRA: { id: 'BRA', name: 'Brasil', shortName: 'BRA', flag: '🇧🇷' },
  MAR: { id: 'MAR', name: 'Marrocos', shortName: 'MAR', flag: '🇲🇦' },
  HAI: { id: 'HAI', name: 'Haiti', shortName: 'HAI', flag: '🇭🇹' },
  SCO: { id: 'SCO', name: 'Escócia', shortName: 'SCO', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },

  USA: { id: 'USA', name: 'EUA', shortName: 'USA', flag: '🇺🇸' },
  PAR: { id: 'PAR', name: 'Paraguai', shortName: 'PAR', flag: '🇵🇾' },
  AUS: { id: 'AUS', name: 'Austrália', shortName: 'AUS', flag: '🇦🇺' },
  TUR: { id: 'TUR', name: 'Turquia', shortName: 'TUR', flag: '🇹🇷' },

  GER: { id: 'GER', name: 'Alemanha', shortName: 'GER', flag: '🇩🇪' },
  CUW: { id: 'CUW', name: 'Curaçao', shortName: 'CUW', flag: '🇨🇼' },
  CIV: { id: 'CIV', name: 'Costa do Marfim', shortName: 'CIV', flag: '🇨🇮' },
  ECU: { id: 'ECU', name: 'Equador', shortName: 'ECU', flag: '🇪🇨' },

  NED: { id: 'NED', name: 'Holanda', shortName: 'NED', flag: '🇳🇱' },
  JPN: { id: 'JPN', name: 'Japão', shortName: 'JPN', flag: '🇯🇵' },
  SWE: { id: 'SWE', name: 'Suécia', shortName: 'SWE', flag: '🇸🇪' },
  TUN: { id: 'TUN', name: 'Tunísia', shortName: 'TUN', flag: '🇹🇳' },

  BEL: { id: 'BEL', name: 'Bélgica', shortName: 'BEL', flag: '🇧🇪' },
  EGY: { id: 'EGY', name: 'Egito', shortName: 'EGY', flag: '🇪🇬' },
  IRN: { id: 'IRN', name: 'Irã', shortName: 'IRN', flag: '🇮🇷' },
  NZL: { id: 'NZL', name: 'Nova Zelândia', shortName: 'NZL', flag: '🇳🇿' },

  ESP: { id: 'ESP', name: 'Espanha', shortName: 'ESP', flag: '🇪🇸' },
  CPV: { id: 'CPV', name: 'Cabo Verde', shortName: 'CPV', flag: '🇨🇻' },
  KSA: { id: 'KSA', name: 'Arábia Saudita', shortName: 'KSA', flag: '🇸🇦' },
  URY: { id: 'URY', name: 'Uruguai', shortName: 'URY', flag: '🇺🇾' },

  FRA: { id: 'FRA', name: 'França', shortName: 'FRA', flag: '🇫🇷' },
  SEN: { id: 'SEN', name: 'Senegal', shortName: 'SEN', flag: '🇸🇳' },
  IRQ: { id: 'IRQ', name: 'Iraque', shortName: 'IRQ', flag: '🇮🇶' },
  NOR: { id: 'NOR', name: 'Noruega', shortName: 'NOR', flag: '🇳🇴' },

  ARG: { id: 'ARG', name: 'Argentina', shortName: 'ARG', flag: '🇦🇷' },
  ALG: { id: 'ALG', name: 'Argélia', shortName: 'ALG', flag: '🇩🇿' },
  AUT: { id: 'AUT', name: 'Áustria', shortName: 'AUT', flag: '🇦🇹' },
  JOR: { id: 'JOR', name: 'Jordânia', shortName: 'JOR', flag: '🇯🇴' },

  POR: { id: 'POR', name: 'Portugal', shortName: 'POR', flag: '🇵🇹' },
  COD: { id: 'COD', name: 'RD Congo', shortName: 'COD', flag: '🇨🇩' },
  UZB: { id: 'UZB', name: 'Uzbequistão', shortName: 'UZB', flag: '🇺🇿' },
  COL: { id: 'COL', name: 'Colômbia', shortName: 'COL', flag: '🇨🇴' },

  ENG: { id: 'ENG', name: 'Inglaterra', shortName: 'ENG', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  CRO: { id: 'CRO', name: 'Croácia', shortName: 'CRO', flag: '🇭🇷' },
  GHA: { id: 'GHA', name: 'Gana', shortName: 'GHA', flag: '🇬🇭' },
  PAN: { id: 'PAN', name: 'Panamá', shortName: 'PAN', flag: '🇵🇦' },
};

export const GROUPS: Group[] = [
  { id: 'A', name: 'Grupo A', teams: ['MEX', 'RSA', 'KOR', 'CZE'] },
  { id: 'B', name: 'Grupo B', teams: ['CAN', 'BIH', 'QAT', 'SUI'] },
  { id: 'C', name: 'Grupo C', teams: ['BRA', 'MAR', 'HAI', 'SCO'] },
  { id: 'D', name: 'Grupo D', teams: ['USA', 'PAR', 'AUS', 'TUR'] },
  { id: 'E', name: 'Grupo E', teams: ['GER', 'CUW', 'CIV', 'ECU'] },
  { id: 'F', name: 'Grupo F', teams: ['NED', 'JPN', 'SWE', 'TUN'] },
  { id: 'G', name: 'Grupo G', teams: ['BEL', 'EGY', 'IRN', 'NZL'] },
  { id: 'H', name: 'Grupo H', teams: ['ESP', 'CPV', 'KSA', 'URY'] },
  { id: 'I', name: 'Grupo I', teams: ['FRA', 'SEN', 'IRQ', 'NOR'] },
  { id: 'J', name: 'Grupo J', teams: ['ARG', 'ALG', 'AUT', 'JOR'] },
  { id: 'K', name: 'Grupo K', teams: ['POR', 'COD', 'UZB', 'COL'] },
  { id: 'L', name: 'Grupo L', teams: ['ENG', 'CRO', 'GHA', 'PAN'] },
];

export const GROUP_MATCHES: GroupMatch[] = [
  // RODADA 1
  { id: 'g_1', round: 1, date: '11/06', homeTeamId: 'MEX', awayTeamId: 'RSA', venue: 'Cidade do México' },
  { id: 'g_2', round: 1, date: '11/06', homeTeamId: 'KOR', awayTeamId: 'CZE', venue: 'Guadalajara' },
  { id: 'g_3', round: 1, date: '12/06', homeTeamId: 'CAN', awayTeamId: 'BIH', venue: 'Toronto' },
  { id: 'g_4', round: 1, date: '12/06', homeTeamId: 'USA', awayTeamId: 'PAR', venue: 'Los Angeles' },
  { id: 'g_5', round: 1, date: '13/06', homeTeamId: 'QAT', awayTeamId: 'SUI', venue: 'Boston' },
  { id: 'g_6', round: 1, date: '13/06', homeTeamId: 'BRA', awayTeamId: 'MAR', venue: 'Vancouver' },
  { id: 'g_7', round: 1, date: '13/06', homeTeamId: 'HAI', awayTeamId: 'SCO', venue: 'Nova York/NJ' },
  { id: 'g_8', round: 1, date: '13/06', homeTeamId: 'AUS', awayTeamId: 'TUR', venue: 'San Francisco' },
  { id: 'g_9', round: 1, date: '14/06', homeTeamId: 'GER', awayTeamId: 'CUW', venue: 'Monterrey' },
  { id: 'g_10', round: 1, date: '14/06', homeTeamId: 'CIV', awayTeamId: 'ECU', venue: 'Houston' },
  { id: 'g_11', round: 1, date: '14/06', homeTeamId: 'NED', awayTeamId: 'JPN', venue: 'Dallas' },
  { id: 'g_12', round: 1, date: '14/06', homeTeamId: 'SWE', awayTeamId: 'TUN', venue: 'Kansas City' },
  { id: 'g_13', round: 1, date: '15/06', homeTeamId: 'BEL', awayTeamId: 'EGY', venue: 'Miami' },
  { id: 'g_14', round: 1, date: '15/06', homeTeamId: 'IRN', awayTeamId: 'NZL', venue: 'Atlanta' },
  { id: 'g_15', round: 1, date: '15/06', homeTeamId: 'ESP', awayTeamId: 'CPV', venue: 'Los Angeles' },
  { id: 'g_16', round: 1, date: '15/06', homeTeamId: 'KSA', awayTeamId: 'URY', venue: 'Seattle' },
  { id: 'g_17', round: 1, date: '16/06', homeTeamId: 'FRA', awayTeamId: 'SEN', venue: 'Nova York/NJ' },
  { id: 'g_18', round: 1, date: '16/06', homeTeamId: 'IRQ', awayTeamId: 'NOR', venue: 'Boston' },
  { id: 'g_19', round: 1, date: '16/06', homeTeamId: 'ARG', awayTeamId: 'ALG', venue: 'Kansas City' },
  { id: 'g_20', round: 1, date: '16/06', homeTeamId: 'AUT', awayTeamId: 'JOR', venue: 'Dallas' },
  { id: 'g_21', round: 1, date: '17/06', homeTeamId: 'POR', awayTeamId: 'COD', venue: 'Houston' },
  { id: 'g_22', round: 1, date: '17/06', homeTeamId: 'UZB', awayTeamId: 'COL', venue: 'Monterrey' },
  { id: 'g_23', round: 1, date: '17/06', homeTeamId: 'ENG', awayTeamId: 'CRO', venue: 'Seattle' },
  { id: 'g_24', round: 1, date: '17/06', homeTeamId: 'GHA', awayTeamId: 'PAN', venue: 'San Francisco' },

  // RODADA 2
  { id: 'g_25', round: 2, date: '18/06', homeTeamId: 'MEX', awayTeamId: 'KOR', venue: 'Guadalajara' },
  { id: 'g_26', round: 2, date: '18/06', homeTeamId: 'CZE', awayTeamId: 'RSA', venue: 'Cidade do México' },
  { id: 'g_27', round: 2, date: '18/06', homeTeamId: 'CAN', awayTeamId: 'QAT', venue: 'Vancouver' },
  { id: 'g_28', round: 2, date: '18/06', homeTeamId: 'SUI', awayTeamId: 'BIH', venue: 'Toronto' },
  { id: 'g_29', round: 2, date: '19/06', homeTeamId: 'BRA', awayTeamId: 'HAI', venue: 'Seattle' },
  { id: 'g_30', round: 2, date: '19/06', homeTeamId: 'SCO', awayTeamId: 'MAR', venue: 'San Francisco' },
  { id: 'g_31', round: 2, date: '19/06', homeTeamId: 'USA', awayTeamId: 'AUS', venue: 'San Francisco' },
  { id: 'g_32', round: 2, date: '19/06', homeTeamId: 'TUR', awayTeamId: 'PAR', venue: 'Los Angeles' },
  { id: 'g_33', round: 2, date: '20/06', homeTeamId: 'GER', awayTeamId: 'CIV', venue: 'Toronto' },
  { id: 'g_34', round: 2, date: '20/06', homeTeamId: 'ECU', awayTeamId: 'CUW', venue: 'Boston' },
  { id: 'g_35', round: 2, date: '20/06', homeTeamId: 'NED', awayTeamId: 'SWE', venue: 'Houston' },
  { id: 'g_36', round: 2, date: '20/06', homeTeamId: 'TUN', awayTeamId: 'JPN', venue: 'Monterrey' },
  { id: 'g_37', round: 2, date: '21/06', homeTeamId: 'BEL', awayTeamId: 'IRN', venue: 'Miami' },
  { id: 'g_38', round: 2, date: '21/06', homeTeamId: 'NZL', awayTeamId: 'EGY', venue: 'Atlanta' },
  { id: 'g_39', round: 2, date: '21/06', homeTeamId: 'ESP', awayTeamId: 'KSA', venue: 'Los Angeles' },
  { id: 'g_40', round: 2, date: '21/06', homeTeamId: 'URY', awayTeamId: 'CPV', venue: 'Seattle' },
  { id: 'g_41', round: 2, date: '22/06', homeTeamId: 'FRA', awayTeamId: 'IRQ', venue: 'Nova York/NJ' },
  { id: 'g_42', round: 2, date: '22/06', homeTeamId: 'NOR', awayTeamId: 'SEN', venue: 'Boston' },
  { id: 'g_43', round: 2, date: '22/06', homeTeamId: 'ARG', awayTeamId: 'AUT', venue: 'Dallas' },
  { id: 'g_44', round: 2, date: '22/06', homeTeamId: 'JOR', awayTeamId: 'ALG', venue: 'Kansas City' },
  { id: 'g_45', round: 2, date: '23/06', homeTeamId: 'POR', awayTeamId: 'UZB', venue: 'Houston' },
  { id: 'g_46', round: 2, date: '23/06', homeTeamId: 'COL', awayTeamId: 'COD', venue: 'Monterrey' },
  { id: 'g_47', round: 2, date: '23/06', homeTeamId: 'ENG', awayTeamId: 'GHA', venue: 'Seattle' },
  { id: 'g_48', round: 2, date: '23/06', homeTeamId: 'PAN', awayTeamId: 'CRO', venue: 'San Francisco' },

  // RODADA 3
  { id: 'g_49', round: 3, date: '24/06', homeTeamId: 'CZE', awayTeamId: 'MEX', venue: 'Cidade do México' },
  { id: 'g_50', round: 3, date: '24/06', homeTeamId: 'RSA', awayTeamId: 'KOR', venue: 'Monterrey' },
  { id: 'g_51', round: 3, date: '24/06', homeTeamId: 'SUI', awayTeamId: 'CAN', venue: 'Vancouver' },
  { id: 'g_52', round: 3, date: '24/06', homeTeamId: 'BIH', awayTeamId: 'QAT', venue: 'Seattle' },
  { id: 'g_53', round: 3, date: '24/06', homeTeamId: 'SCO', awayTeamId: 'BRA', venue: 'Atlanta' },
  { id: 'g_54', round: 3, date: '24/06', homeTeamId: 'MAR', awayTeamId: 'HAI', venue: 'Miami' },
  { id: 'g_55', round: 3, date: '25/06', homeTeamId: 'TUR', awayTeamId: 'USA', venue: 'Los Angeles' },
  { id: 'g_56', round: 3, date: '25/06', homeTeamId: 'PAR', awayTeamId: 'AUS', venue: 'San Francisco' },
  { id: 'g_57', round: 3, date: '25/06', homeTeamId: 'ECU', awayTeamId: 'GER', venue: 'Filadélfia' },
  { id: 'g_58', round: 3, date: '25/06', homeTeamId: 'CUW', awayTeamId: 'CIV', venue: 'Nova York/NJ' },
  { id: 'g_59', round: 3, date: '25/06', homeTeamId: 'TUN', awayTeamId: 'NED', venue: 'Boston' },
  { id: 'g_60', round: 3, date: '25/06', homeTeamId: 'JPN', awayTeamId: 'SWE', venue: 'Kansas City' },
  { id: 'g_61', round: 3, date: '26/06', homeTeamId: 'NZL', awayTeamId: 'BEL', venue: 'Dallas' },
  { id: 'g_62', round: 3, date: '26/06', homeTeamId: 'EGY', awayTeamId: 'IRN', venue: 'Houston' },
  { id: 'g_63', round: 3, date: '26/06', homeTeamId: 'URY', awayTeamId: 'ESP', venue: 'Miami' },
  { id: 'g_64', round: 3, date: '26/06', homeTeamId: 'CPV', awayTeamId: 'KSA', venue: 'Atlanta' },
  { id: 'g_65', round: 3, date: '26/06', homeTeamId: 'FRA', awayTeamId: 'NOR', venue: 'Filadélfia' },
  { id: 'g_66', round: 3, date: '26/06', homeTeamId: 'SEN', awayTeamId: 'IRQ', venue: 'Nova York/NJ' },
  { id: 'g_67', round: 3, date: '27/06', homeTeamId: 'JOR', awayTeamId: 'ARG', venue: 'Kansas City' },
  { id: 'g_68', round: 3, date: '27/06', homeTeamId: 'ALG', awayTeamId: 'AUT', venue: 'Dallas' },
  { id: 'g_69', round: 3, date: '27/06', homeTeamId: 'COL', awayTeamId: 'POR', venue: 'Miami' },
  { id: 'g_70', round: 3, date: '27/06', homeTeamId: 'COD', awayTeamId: 'UZB', venue: 'Atlanta' },
  { id: 'g_71', round: 3, date: '27/06', homeTeamId: 'PAN', awayTeamId: 'ENG', venue: 'Boston' },
  { id: 'g_72', round: 3, date: '27/06', homeTeamId: 'CRO', awayTeamId: 'GHA', venue: 'Filadélfia' },
];
