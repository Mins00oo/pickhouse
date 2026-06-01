import { useState } from 'react';
import { Modal, View, Pressable, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import { Address } from '@/types';
import { colors, spacing, typography } from '@/theme';

const HTML = `
<!DOCTYPE html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>주소 검색</title>
<script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>
</head>
<body style="margin:0;padding:0;background:#faf6f0;">
<div id="layer" style="width:100vw;height:100vh;"></div>
<script>
function postToApp(obj) {
  var msg = JSON.stringify(obj);
  // 브리지가 아직 주입되기 전이면 잠깐 뒤 재시도한다.
  if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
    window.ReactNativeWebView.postMessage(msg);
  } else {
    setTimeout(function () {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(msg);
      }
    }, 100);
  }
}
new daum.Postcode({
  oncomplete: function(data) {
    try {
      postToApp({
        type: 'address:selected',
        payload: {
          roadAddress: data.roadAddress || data.autoRoadAddress || '',
          jibunAddress: data.jibunAddress || data.autoJibunAddress || '',
          zonecode: data.zonecode || ''
        }
      });
    } catch (e) {}
  },
  width: '100%',
  height: '100%'
}).embed(document.getElementById('layer'));
</script>
</body></html>
`;

export interface KakaoAddressPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (addr: Address) => void;
}

type AddressShape = {
  roadAddress?: unknown;
  jibunAddress?: unknown;
  zonecode?: unknown;
};

type AddressMessage = AddressShape & {
  type?: unknown;
  payload?: AddressShape;
};

function toAddress(shape: AddressShape | undefined): Address | null {
  if (
    !shape ||
    typeof shape.roadAddress !== 'string' ||
    typeof shape.jibunAddress !== 'string' ||
    typeof shape.zonecode !== 'string' ||
    (!shape.roadAddress && !shape.jibunAddress)
  ) {
    return null;
  }
  return {
    roadAddress: shape.roadAddress,
    jibunAddress: shape.jibunAddress,
    zonecode: shape.zonecode,
  };
}

export function KakaoAddressPicker({ visible, onClose, onSelect }: KakaoAddressPickerProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleMessage(e: WebViewMessageEvent) {
    try {
      const parsed = JSON.parse(e.nativeEvent.data) as AddressMessage;
      // 기본 경로: 타입이 명시된 envelope({ type, payload }).
      // 방어적 fallback: type 없이 평평한 { roadAddress, jibunAddress, zonecode } 형태도 허용해
      // 구버전/엣지 메시지 형태에서도 선택이 등록되게 한다.
      const address =
        parsed.type === 'address:selected'
          ? toAddress(parsed.payload)
          : parsed.type === undefined
            ? toAddress(parsed)
            : null;
      if (!address) return;
      onSelect(address);
      onClose();
    } catch {
      // ignore parse errors
    }
  }

  function handleLoadError() {
    setErrorMessage('주소 검색을 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      {/* RN Modal 은 앱 레벨 SafeAreaProvider(App.tsx)에서 분리되므로 inset 이 0 으로 잡힌다.
          모달 내부에 SafeAreaProvider 를 다시 두어 상단 노치/다이내믹 아일랜드 영역을 확보한다. */}
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }} edges={['top', 'bottom']}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: spacing.lg,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Text style={typography.heading}>주소 검색</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={[typography.body, { color: colors.inkMuted }]}>닫기</Text>
            </Pressable>
          </View>
          {errorMessage ? (
            <Text style={[typography.caption, { color: colors.coral, padding: spacing.lg }]}>
              {errorMessage}
            </Text>
          ) : null}
          <WebView
            testID="kakao-address-webview"
            originWhitelist={['*']}
            // baseUrl 로 실제 https origin 을 부여한다. 이게 없으면 문서 origin 이 about:blank(null)이 되어
            // 다음 우편번호 위젯의 iframe→부모창 postMessage 가 origin 검사에 막혀 oncomplete 가 호출되지 않는다.
            // (검색 결과는 iframe 내부라 보이지만, 결과 "선택"이 앱으로 전달되지 않던 원인)
            source={{ html: HTML, baseUrl: 'https://postcode.map.daum.net' }}
            javaScriptEnabled
            domStorageEnabled
            onLoadStart={() => setErrorMessage(null)}
            onMessage={handleMessage}
            onError={handleLoadError}
            onHttpError={handleLoadError}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}
