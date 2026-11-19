// Spec: spec:counter/external-match-link
//
// Browser adapter: once the external match link has been read, its params are removed
// from the address bar so that a reload restores the persisted session instead of
// re-applying the link. Other query params (e.g. ?mode=) and the history state are kept.
import { stripExternalMatchParams } from './externalMatchLink';

type LocationLike = Pick<Location, 'pathname' | 'search' | 'hash'>;
type HistoryLike = Pick<History, 'state' | 'replaceState'>;

export const removeExternalMatchParamsFromAddressBar = (
  location: LocationLike = window.location,
  history: HistoryLike = window.history,
): void => {
  const search = stripExternalMatchParams(location.search);
  if (search === location.search) return;
  history.replaceState(history.state, '', `${location.pathname}${search}${location.hash}`);
};
