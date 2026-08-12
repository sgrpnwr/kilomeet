import { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';

type Props = {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export function KeyboardAvoidingWrapper({ children, contentContainerStyle }: Props) {
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 80,
  },
});