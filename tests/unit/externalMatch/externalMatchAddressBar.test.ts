import { describe, expect, it, vi } from 'vitest';

import { removeExternalMatchParamsFromAddressBar } from '../../../src/features/external-match/externalMatchAddressBar';

// Spec ref: spec:counter/external-match-link
const fakeHistory = () => ({ state: { appScreen: 'SETUP' }, replaceState: vi.fn<History['replaceState']>() });

describe('removeExternalMatchParamsFromAddressBar', () => {
  it('removes the link params, keeping other params, the hash and the history state', () => {
    const history = fakeHistory();
    removeExternalMatchParamsFromAddressBar(
      { pathname: '/', search: '?game=x01&p1=A&p2=B&return=https%3A%2F%2Fbadarts.fr%2Fx&mode=personal_phone', hash: '#top' },
      history,
    );
    expect(history.replaceState).toHaveBeenCalledWith({ appScreen: 'SETUP' }, '', '/?mode=personal_phone#top');
  });

  it('leaves a clean address bar as is', () => {
    const history = fakeHistory();
    removeExternalMatchParamsFromAddressBar({ pathname: '/', search: '?mode=local', hash: '' }, history);
    expect(history.replaceState).not.toHaveBeenCalled();
  });
});
