import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';

if (!LocaleConfig.locales['ko']) {
  LocaleConfig.locales['ko'] = {
    monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
    dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
    today: '오늘',
  };
}
LocaleConfig.defaultLocale = 'ko';

function formatKorean(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${y}년 ${m}월 ${d}일`;
}

export interface DateFieldProps {
  value: string; // ISO yyyy-mm-dd
  onChange: (iso: string) => void;
  testID?: string;
}

export function DateField({ value, onChange, testID = 'visited-at' }: DateFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel="방문일 선택"
        onPress={() => setOpen(true)}
        style={{
          height: 52,
          backgroundColor: colors.white,
          borderRadius: 13,
          borderWidth: 1,
          borderColor: value ? colors.borderHard : colors.borderSoft,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          gap: 8,
        }}
      >
        <Ionicons name="calendar-outline" size={17} color={colors.muted} />
        <Text
          style={{
            flex: 1,
            fontSize: 15,
            fontWeight: '600',
            letterSpacing: -0.3,
            color: value ? colors.inkStrong : colors.muted,
          }}
        >
          {value ? formatKorean(value) : '날짜 선택'}
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable
          testID="visited-at-backdrop"
          onPress={() => setOpen(false)}
          style={{ flex: 1, backgroundColor: 'rgba(14,26,20,0.35)', justifyContent: 'flex-end' }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: colors.white,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 12,
              paddingBottom: 28,
            }}
          >
            <View style={{ alignItems: 'center', paddingVertical: 8 }}>
              <View style={{ width: 40, height: 4.5, borderRadius: 3, backgroundColor: '#D8D5CD' }} />
            </View>
            <Calendar
              testID="visited-at-calendar"
              current={value || undefined}
              markedDates={value ? { [value]: { selected: true, selectedColor: colors.primary } } : {}}
              onDayPress={(day: { dateString: string }) => {
                onChange(day.dateString);
                setOpen(false);
              }}
              theme={{
                selectedDayBackgroundColor: colors.primary,
                todayTextColor: colors.primary,
                arrowColor: colors.primary,
                textMonthFontWeight: '700',
                textDayFontWeight: '500',
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
