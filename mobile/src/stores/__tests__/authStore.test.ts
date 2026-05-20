import { useAuthStore } from '../authStore';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, accessToken: null, refreshToken: null, status: 'unknown' });
  });

  it('setSession populates user and tokens, marks authenticated', () => {
    useAuthStore.getState().setSession({
      user: { id: 'u1', authProviders: { apple: 'a' }, createdAt: '' },
      accessToken: 'a',
      refreshToken: 'r',
    });
    expect(useAuthStore.getState().user?.id).toBe('u1');
    expect(useAuthStore.getState().status).toBe('authenticated');
  });

  it('clear resets state to unauthenticated', () => {
    useAuthStore.setState({
      user: { id: 'u1', authProviders: {}, createdAt: '' },
      accessToken: 'a',
      refreshToken: 'r',
      status: 'authenticated',
    });
    useAuthStore.getState().clear();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
  });

  it('updateTokens replaces only tokens', () => {
    useAuthStore.setState({
      user: { id: 'u1', authProviders: {}, createdAt: '' },
      accessToken: 'a',
      refreshToken: 'r',
      status: 'authenticated',
    });
    useAuthStore.getState().updateTokens({ accessToken: 'a2', refreshToken: 'r2' });
    const s = useAuthStore.getState();
    expect(s.accessToken).toBe('a2');
    expect(s.refreshToken).toBe('r2');
    expect(s.user?.id).toBe('u1');
  });
});
