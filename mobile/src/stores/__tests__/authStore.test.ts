import { useAuthStore } from '../authStore';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ accessToken: null, refreshToken: null, status: 'unknown' });
  });

  it('setSession stores tokens and marks authenticated', () => {
    useAuthStore.getState().setSession({ accessToken: 'a', refreshToken: 'r' });
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: 'a',
      refreshToken: 'r',
      status: 'authenticated',
    });
  });

  it('clear resets tokens and marks unauthenticated', () => {
    useAuthStore.setState({
      accessToken: 'a',
      refreshToken: 'r',
      status: 'authenticated',
    });
    useAuthStore.getState().clear();
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: null,
      refreshToken: null,
      status: 'unauthenticated',
    });
  });

  it('updateTokens replaces the rotated token pair', () => {
    useAuthStore.setState({
      accessToken: 'a',
      refreshToken: 'r',
      status: 'authenticated',
    });
    useAuthStore.getState().updateTokens({ accessToken: 'a2', refreshToken: 'r2' });
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: 'a2',
      refreshToken: 'r2',
      status: 'authenticated',
    });
  });
});
