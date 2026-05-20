import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

export interface AppleSignInButtonProps {
  onPress: () => void;
}

export function AppleSignInButton({ onPress }: AppleSignInButtonProps) {
  if (Platform.OS !== 'ios') return null;
  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={999}
      style={{ width: '100%', height: 52 }}
      onPress={onPress}
    />
  );
}
