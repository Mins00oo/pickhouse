import type { ReactNode } from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KakaoAddressPicker } from '../kakaoAddress';

// KakaoAddressPicker 는 모달 내부에 다시 SafeAreaProvider 를 둔다. 그 중첩 provider 는
// inset 이 측정되기 전까지 자식을 렌더하지 않으므로, 테스트에서는 initialMetrics 를 가진
// 부모 SafeAreaProvider 로 감싸 inset 을 동기적으로 상속받게 한다(실제 앱에도 앱 레벨 provider 가 있음).
function renderPicker(node: ReactNode) {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 44, right: 0, bottom: 34, left: 0 },
      }}
    >
      {node}
    </SafeAreaProvider>,
  );
}

describe('KakaoAddressPicker', () => {
  it('selects an address from the typed WebView message and closes the modal', () => {
    const onClose = jest.fn();
    const onSelect = jest.fn();
    const { getByTestId } = renderPicker(
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
    const { getByTestId } = renderPicker(
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
    const { getByTestId, queryByText } = renderPicker(
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
