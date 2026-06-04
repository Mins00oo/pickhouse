import { Image, View, Pressable, Text } from 'react-native';
import { Photo } from '@/types';
import { colors, radii, spacing, typography } from '@/theme';

export interface PhotoGridProps {
  photos: Photo[];
  onAdd?: () => void;
  onRemove?: (id: string) => void;
}

export function PhotoGrid({ photos, onAdd, onRemove }: PhotoGridProps) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
      {photos.map((p) => (
        <View key={p.id} style={{ position: 'relative' }}>
          <Image
            source={{ uri: p.remoteUrl ?? p.localUri }}
            style={{ width: 96, height: 96, borderRadius: radii.md, backgroundColor: colors.creamDark }}
          />
          {onRemove ? (
            <Pressable
              onPress={() => onRemove(p.id)}
              style={{
                position: 'absolute',
                top: -6,
                right: -6,
                backgroundColor: colors.ink,
                width: 22,
                height: 22,
                borderRadius: 11,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: colors.white, fontSize: 12 }}>×</Text>
            </Pressable>
          ) : null}
        </View>
      ))}
      {onAdd ? (
        <Pressable
          testID="photo-add-button"
          onPress={onAdd}
          style={{
            width: 96,
            height: 96,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: colors.border,
            borderStyle: 'dashed',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.white,
          }}
        >
          <Text style={[typography.caption, { color: colors.inkMuted }]}>+ 사진</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
