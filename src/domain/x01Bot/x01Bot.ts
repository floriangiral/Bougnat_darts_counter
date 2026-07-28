import type { Player, X01BotLevel } from '../../../types';

export type X01BotLevelDefinition = {
  level: X01BotLevel;
  label: string;
  averageMin: number;
  averageMax: number;
  averageDisplayFloor?: number;
};

export const X01_BOT_LEVELS: X01BotLevelDefinition[] = [
  { level: 'AMATEUR', label: 'Amateur', averageMin: 30, averageMax: 40 },
  { level: 'LOISIR', label: 'Loisir', averageMin: 40, averageMax: 55 },
  { level: 'CLUB', label: 'Club', averageMin: 55, averageMax: 70 },
  { level: 'CONFIRME', label: 'Confirme', averageMin: 70, averageMax: 85 },
  { level: 'PRO', label: 'Pro', averageMin: 86, averageMax: 120, averageDisplayFloor: 85 },
];

const X01_BOT_FIRST_NAMES = [
  'Alexis',
  'Alice',
  'Arthur',
  'Bruno',
  'Cyril',
  'Chloe',
  'Clara',
  'Clement',
  'Emma',
  'Enzo',
  'Florian',
  'Gabriel',
  'Guillaume',
  'Hugo',
  'Jade',
  'Julien',
  'Lea',
  'Leo',
  'Lina',
  'Louise',
  'Lucas',
  'Manon',
  'Margaux',
  'Maxime',
  'Mathis',
  'Nathan',
  'Nina',
  'Noah',
  'Paul',
  'Sarah',
  'Theo',
  'Tom',
  'Zoe',
] as const;

export const DEFAULT_X01_BOT_LEVEL: X01BotLevel = 'AMATEUR';

export const getX01BotLevelDefinition = (level: X01BotLevel) =>
  X01_BOT_LEVELS.find((definition) => definition.level === level) ?? X01_BOT_LEVELS[0];

export const formatX01BotAverageRange = (definition: X01BotLevelDefinition) =>
  definition.level === 'PRO'
    ? `+ de ${definition.averageDisplayFloor ?? definition.averageMin} de moyenne`
    : `${definition.averageMin} a ${definition.averageMax} de moyenne`;

export const buildRandomX01BotName = (random: () => number = Math.random) => {
  const safeIndex = Math.max(0, Math.min(
    X01_BOT_FIRST_NAMES.length - 1,
    Math.floor(random() * X01_BOT_FIRST_NAMES.length),
  ));

  return `[BOT] ${X01_BOT_FIRST_NAMES[safeIndex]}`;
};

export const isX01BotPlayer = (player: Player | undefined): player is Player & { isBot: true } =>
  Boolean(player?.isBot);
