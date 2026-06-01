import { forwardRef, useImperativeHandle, type ReactNode } from 'react';
import { ScrollView, View, type ViewProps } from 'react-native';

// 테스트용 @gorhom/bottom-sheet 목. 실제 제스처/애니메이션 없이 자식을 그대로 렌더한다.
type SheetProps = ViewProps & {
  children?: ReactNode;
  handleComponent?: () => ReactNode;
};

const BottomSheet = forwardRef<unknown, SheetProps>(({ children, handleComponent }, ref) => {
  useImperativeHandle(ref, () => ({
    snapToIndex: () => {},
    snapToPosition: () => {},
    expand: () => {},
    collapse: () => {},
    close: () => {},
    forceClose: () => {},
  }));
  return (
    <View>
      {handleComponent ? handleComponent() : null}
      {children}
    </View>
  );
});
BottomSheet.displayName = 'MockBottomSheet';

export const BottomSheetView = ({ children, ...props }: SheetProps) => (
  <View {...props}>{children}</View>
);

export const BottomSheetScrollView = ({ children, ...props }: SheetProps) => (
  <ScrollView {...props}>{children}</ScrollView>
);

export default BottomSheet;
