import React from 'react';
import { StyleSheet, Text, TextInput, type TextStyle } from 'react-native';

// 정적(static) weight 폰트. iOS 에서 가변폰트가 'Pretendard' 패밀리로 안 잡히는 문제를 피한다.
// 각 굵기를 고유 패밀리명으로 등록하고, fontWeight 를 그 패밀리로 매핑한다.
export const PRETENDARD = 'Pretendard-Regular';
export const PRETENDARD_MEDIUM = 'Pretendard-Medium';
export const PRETENDARD_SEMIBOLD = 'Pretendard-SemiBold';
export const PRETENDARD_BOLD = 'Pretendard-Bold';
export const PRETENDARD_EXTRABOLD = 'Pretendard-ExtraBold';

export const fontAssets = {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  [PRETENDARD]: require('../../assets/fonts/Pretendard-Regular.otf'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  [PRETENDARD_MEDIUM]: require('../../assets/fonts/Pretendard-Medium.otf'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  [PRETENDARD_SEMIBOLD]: require('../../assets/fonts/Pretendard-SemiBold.otf'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  [PRETENDARD_BOLD]: require('../../assets/fonts/Pretendard-Bold.otf'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  [PRETENDARD_EXTRABOLD]: require('../../assets/fonts/Pretendard-ExtraBold.otf'),
};

/** fontWeight → 정적 패밀리명. 정적 폰트는 weight 축이 없어 굵기별 파일을 직접 골라야 한다. */
export function pretendardFamily(weight?: TextStyle['fontWeight']): string {
  switch (String(weight)) {
    case '500':
      return PRETENDARD_MEDIUM;
    case '600':
      return PRETENDARD_SEMIBOLD;
    case '700':
    case 'bold':
      return PRETENDARD_BOLD;
    case '800':
    case '900':
      return PRETENDARD_EXTRABOLD;
    default:
      return PRETENDARD;
  }
}

let patched = false;

/**
 * 앱 전역 기본 글꼴을 Pretendard 로 지정한다.
 * RN 의 Text/TextInput 은 forwardRef 라 defaultProps 병합이 안 되므로 render 를 감싼다.
 * 컴포넌트가 fontFamily 를 직접 지정한 경우는 존중하고, 아니면 fontWeight 에 맞는 정적 패밀리를 깔아준다.
 */
export function applyGlobalFont(): void {
  if (patched) return;
  patched = true;
  patchRender(Text as unknown as { render?: (...args: unknown[]) => React.ReactElement | null });
  patchRender(TextInput as unknown as { render?: (...args: unknown[]) => React.ReactElement | null });
}

function patchRender(Comp: { render?: (...args: unknown[]) => React.ReactElement | null }): void {
  const original = Comp.render;
  if (typeof original !== 'function') return;
  Comp.render = function patchedRender(...args: unknown[]) {
    const element = original.apply(this, args);
    if (!element) return element;
    const prevStyle = (element.props as { style?: unknown })?.style;
    const flat = StyleSheet.flatten(prevStyle as TextStyle) as TextStyle | undefined;
    if (flat?.fontFamily) return element; // 직접 지정한 글꼴은 그대로 둔다.
    const family = pretendardFamily(flat?.fontWeight);
    return React.cloneElement(element, { style: [{ fontFamily: family }, prevStyle] } as never);
  };
}
