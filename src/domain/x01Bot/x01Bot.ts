import type { Player, X01BotLevel } from '../../../types';

export type X01BotLevelDefinition = {
  level: X01BotLevel;
  label: string;
  averageMin: number;
  averageMax: number;
};

export const X01_BOT_LEVELS: X01BotLevelDefinition[] = [
  { level: 'AMATEUR', label: 'Amateur', averageMin: 30, averageMax: 40 },
  { level: 'LOISIR', label: 'Loisir', averageMin: 40, averageMax: 55 },
  { level: 'CLUB', label: 'Club', averageMin: 55, averageMax: 70 },
  { level: 'CONFIRME', label: 'Confirme', averageMin: 70, averageMax: 85 },
  { level: 'PRO', label: 'Pro', averageMin: 100, averageMax: 120 },
];

export const DEFAULT_X01_BOT_LEVEL: X01BotLevel = 'AMATEUR';

export const getX01BotLevelDefinition = (level: X01BotLevel) =>
  X01_BOT_LEVELS.find((definition) => definition.level === level) ?? X01_BOT_LEVELS[0];

export const formatX01BotAverageRange = (definition: X01BotLevelDefinition) =>
  definition.level === 'PRO'
    ? `+ de ${definition.averageMin} de moyenne`
    : `${definition.averageMin} a ${definition.averageMax} de moyenne`;

export const isX01BotPlayer = (player: Player | undefined): player is Player & { isBot: true } =>
  Boolean(player?.isBot);
