import { useState } from 'react';
import { Modal, View, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
new daum.Postcode({
  oncomplete: function(data) {
    try {
      var msg = JSON.stringify({
        type: 'address:selected',
        payload: {
          roadAddress: data.roadAddress || data.autoRoadAddress || '',
          jibunAddress: data.jibunAddress || data.autoJibunAddress || '',
          zonecode: data.zonecode || ''
        }
      });
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(msg);
      }
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

type AddressMessage = {
  type?: unknown;
  payload?: {
    roadAddress?: unknown;
    jibunAddress?: unknown;
    zonecode?: unknown;
  };
};

export function KakaoAddressPicker({ visible, onClose, onSelect }: KakaoAddressPickerProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleMessage(e: WebViewMessageEvent) {
    try {
      const parsed = JSON.parse(e.nativeEvent.data) as AddressMessage;
      if (parsed.type !== 'address:selected') return;
      const payload = parsed.payload;
      if (
        !payload ||
        typeof payload.roadAddress !== 'string' ||
        typeof payload.jibunAddress !== 'string' ||
        typeof payload.zonecode !== 'string' ||
        (!payload.roadAddress && !payload.jibunAddress)
      ) {
        return;
      }
      onSelect({
        roadAddress: payload.roadAddress,
        jibunAddress: payload.jibunAddress,
        zonecode: payload.zonecode,
      });
      onClose();
    } catch {
      // ignore parse errors
    }
  }

  function handleLoadError() {
    setErrorMessage('주소 검색을 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
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
          <Pressable onPress={onClose}>
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
          source={{ html: HTML }}
          javaScriptEnabled
          domStorageEnabled
          onLoadStart={() => setErrorMessage(null)}
          onMessage={handleMessage}
          onError={handleLoadError}
          onHttpError={handleLoadError}
        />
      </SafeAreaView>
    </Modal>
  );
}
