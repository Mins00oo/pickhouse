import { getAuthErrorMessage, isAuthCancellation } from '../authErrors';

describe('authErrors', () => {
  it('detects Apple cancellation by Expo error code', () => {
    expect(isAuthCancellation({ code: 'ERR_REQUEST_CANCELED' })).toBe(true);
  });

  it('detects cancellation messages from native auth providers', () => {
    expect(isAuthCancellation(new Error('The user canceled the authorization attempt'))).toBe(true);
    expect(isAuthCancellation(new Error('User cancelled login'))).toBe(true);
  });

  it('extracts backend error messages from Axios responses', () => {
    expect(
      getAuthErrorMessage({
        response: {
          data: {
            error: {
              message: 'Kakao ID token invalid: audience mismatch',
            },
          },
        },
        message: 'Request failed with status code 401',
      }),
    ).toBe('Kakao ID token invalid: audience mismatch');
  });
});
