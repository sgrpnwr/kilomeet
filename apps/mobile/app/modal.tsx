import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { api } from '@/lib/api';
import { validateActivityForm } from '@/lib/validators';

const ACTIVITY_TYPES = ['RUN', 'RIDE', 'WALK'] as const;

export default function LogRunScreen() {
  const [type, setType] = useState<(typeof ACTIVITY_TYPES)[number]>('RUN');
  const [distance, setDistance] = useState(''); // in km, we'll convert to meters
  const [duration, setDuration] = useState(''); // in minutes, we'll convert to seconds
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    const { isValid, errors, distanceNum, durationNum } = validateActivityForm({
      type,
      distance,
      duration,
    });

    if (!isValid) {
      Alert.alert('Check your input', errors.join('\n'));
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/activities', {
        type,
        distance: distanceNum * 1000, // km -> meters, since our API stores meters
        duration: durationNum * 60, // minutes -> seconds
        startedAt: new Date().toISOString(),
      });

      Alert.alert('Activity logged! 🎉', '', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Failed to log activity', err.response?.data?.error || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Log a run</Text>

      <Text style={styles.label}>Type</Text>
      <View style={styles.typeRow}>
        {ACTIVITY_TYPES.map((t) => (
          <Pressable
            key={t}
            style={[styles.typeButton, type === t && styles.typeButtonActive]}
            onPress={() => setType(t)}
          >
            <Text style={[styles.typeText, type === t && styles.typeTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Distance (km)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 5.2"
        keyboardType="decimal-pad"
        value={distance}
        onChangeText={setDistance}
      />

      <Text style={styles.label}>Duration (minutes)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 30"
        keyboardType="number-pad"
        value={duration}
        onChangeText={setDuration}
      />

      <Pressable style={styles.button} onPress={handleSubmit} disabled={isSubmitting}>
        <Text style={styles.buttonText}>{isSubmitting ? 'Saving...' : 'Save Activity'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 8 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#444', marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  typeButtonActive: { backgroundColor: '#111', borderColor: '#111' },
  typeText: { color: '#111', fontWeight: '600' },
  typeTextActive: { color: '#fff' },
  button: {
    backgroundColor: '#111',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});