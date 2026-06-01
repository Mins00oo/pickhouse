import { fireEvent, render } from '@testing-library/react-native';
import { KakaoAddressPicker } from '../kakaoAddress';

describe('KakaoAddressPicker', () => {
  it('selects an address from the typed WebView message and closes the modal', () => {
    const onClose = jest.fn();
    const onSelect = jest.fn();
    const { getByTestId } = render(
      <KakaoAddressPicker visible onClose={onClose} onSelect={onSelect} />,
    );

    fireEvent(getByTestId('kakao-address-webview'), 'message', {
      nativeEvent: {
        data: JSON.stringify({
          type: 'address:selected',
          payload: {
            roadAddress: '서울 구로구 공원로6길 16-22',
            jibunAddress: '서울 구로구 구로동 46-4',
            zonecode: '08297',
          },
        }),
      },
    });

    expect(onSelect).toHaveBeenCalledWith({
      roadAddress: '서울 구로구 공원로6길 16-22',
      jibunAddress: '서울 구로구 구로동 46-4',
      zonecode: '08297',
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ignores malformed or unrelated WebView messages', () => {
    const onClose = jest.fn();
    const onSelect = jest.fn();
    const { getByTestId } = render(
      <KakaoAddressPicker visible onClose={onClose} onSelect={onSelect} />,
    );
    const webView = getByTestId('kakao-address-webview');

    fireEvent(webView, 'message', { nativeEvent: { data: 'not-json' } });
    fireEvent(webView, 'message', {
      nativeEvent: {
        data: JSON.stringify({
          type: 'address:ignored',
          payload: {
            roadAddress: '서울 구로구 공원로6길 16-22',
            jibunAddress: '서울 구로구 구로동 46-4',
            zonecode: '08297',
          },
        }),
      },
    });

    expect(onSelect).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('clears a prior load error when the WebView reloads', () => {
    const { getByTestId, queryByText } = render(
      <KakaoAddressPicker visible onClose={jest.fn()} onSelect={jest.fn()} />,
    );
    const webView = getByTestId('kakao-address-webview');
    fireEvent(webView, 'error', { nativeEvent: {} });
    expect(queryByText(/불러오지 못했어요/)).toBeTruthy();

    // 재오픈 시 WebView 가 다시 로드되며 onLoadStart 로 오류가 초기화된다
    fireEvent(webView, 'loadStart', { nativeEvent: {} });
    expect(queryByText(/불러오지 못했어요/)).toBeNull();
  });
});
