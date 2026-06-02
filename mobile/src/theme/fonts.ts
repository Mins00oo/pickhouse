import React from 'react';
import { Text, TextInput } from 'react-native';

// Pretendard 가변폰트 1개 = 모든 굵기 포함. fontWeight 가 그대로 weight 축에 매핑된다.
export const PRETENDARD = 'Pretendard';

export const fontAssets = {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  [PRETENDARD]: require('../../assets/fonts/PretendardVariable.ttf'),
};

let patched = false;

/**
 * 앱 전역 기본 글꼴을 Pretendard 로 지정한다.
 * RN 의 Text/TextInput 은 forwardRef 라 defaultProps.style 병합이 안 되므로,
 * forwardRef 의 render 를 감싸 렌더 결과에 fontFamily 를 "기본값으로" 앞에 깔아준다.
 * (컴포넌트가 지정한 fontWeight/fontSize 등은 그대로 우선 적용된다.)
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
    return React.cloneElement(element, { style: [{ fontFamily: PRETENDARD }, prevStyle] } as never);
  };
}
