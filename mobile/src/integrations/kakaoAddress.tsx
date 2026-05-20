import { Modal, View, Pressable, Text } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
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
    window.ReactNativeWebView.postMessage(JSON.stringify({
      roadAddress: data.roadAddress,
      jibunAddress: data.jibunAddress,
      zonecode: data.zonecode
    }));
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

export function KakaoAddressPicker({ visible, onClose, onSelect }: KakaoAddressPickerProps) {
  function handleMessage(e: WebViewMessageEvent) {
    try {
      const parsed = JSON.parse(e.nativeEvent.data) as {
        roadAddress: string;
        jibunAddress: string;
        zonecode: string;
      };
      onSelect({
        roadAddress: parsed.roadAddress,
        jibunAddress: parsed.jibunAddress,
        zonecode: parsed.zonecode,
      });
      onClose();
    } catch {
      // ignore parse errors
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.cream }}>
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
        <WebView
          originWhitelist={['*']}
          source={{ html: HTML }}
          onMessage={handleMessage}
        />
      </View>
    </Modal>
  );
}
