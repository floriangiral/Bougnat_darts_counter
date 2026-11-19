// Spec: spec:counter/external-match-link
//
// Startup arbitration between an incoming external match link and the restored session:
// a link must never silently replace a match in progress or a linked result that has not
// been sent yet. Pure module: the caller asks the players when a conflict is returned.
import type { PersistedAppSession } from '../../shared/session/persistedAppSession';
import { buildExternalReturnUrl, isExternalMatchContext } from './externalMatchLink';
import type { ExternalReturnPolicy } from './externalMatchLink';

export type ExternalLinkConflict = 'match-in-progress' | 'unsent-result';

type RestoredSessionView = Pick<PersistedAppSession, 'screen' | 'currentMatch' | 'matchRuntime' | 'externalMatch'>;

const GAME_SCREENS = new Set([
  'MATCH',
  'CRICKET_GAME',
  'CAPITAL_GAME',
  'KILLER_GAME',
  'GOTCHA_GAME',
  'TRIATHLON_GAME',
]);

/**
 * What a new external link would overwrite in the restored session:
 * - `match-in-progress`: a game screen (any game) with a match;
 * - `unsent-result`: the end screen of a linked match whose result can still be sent;
 * - null: nothing worth protecting, the link can be applied directly.
 */
export const getExternalLinkConflict = (
  session: RestoredSessionView | null | undefined,
  policy: ExternalReturnPolicy,
): ExternalLinkConflict | null => {
  if (!session) return null;
  const match = session.matchRuntime?.match ?? session.currentMatch;
  if (!match) return null;
  if (GAME_SCREENS.has(session.screen)) return 'match-in-progress';
  if (
    session.screen === 'STATS'
    && isExternalMatchContext(session.externalMatch)
    && buildExternalReturnUrl(session.externalMatch, match, policy) !== null
  ) {
    return 'unsent-result';
  }
  return null;
};
