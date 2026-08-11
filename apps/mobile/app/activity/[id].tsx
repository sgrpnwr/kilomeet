import { useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getComments, postComment } from '@/lib/social';
import { Comment } from '@/types/activity';
import { formatDate } from '@/lib/format';

export default function ActivityCommentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getComments(id).then(setComments).catch(console.error);
    }, [id])
  );

  async function handleSend() {
    if (!text.trim()) return;
    setIsSubmitting(true);
    try {
      const newComment = await postComment(id, text.trim());
      setComments((prev) => [...prev, newComment]);
      setText('');
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen options={{ title: 'Comments' }} />

      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No comments yet — be the first!</Text>}
        renderItem={({ item }) => (
          <View style={styles.commentRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.user.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.commentBody}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentUser}>{item.user.name}</Text>
                <Text style={styles.commentDate}>{formatDate(item.createdAt)}</Text>
              </View>
              <Text style={styles.commentText}>{item.text}</Text>
            </View>
          </View>
        )}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Add a comment..."
            placeholderTextColor="#8e8e93"
            value={text}
            onChangeText={setText}
            multiline
          />
          <Pressable style={styles.sendButton} onPress={handleSend} disabled={isSubmitting}>
            <Text style={styles.sendText}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0c' },
  list: { padding: 16, gap: 16 },
  empty: { textAlign: 'center', color: '#8e8e93', marginTop: 40 },
  commentRow: { flexDirection: 'row', gap: 10 },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#fc4c02', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  commentBody: { flex: 1 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  commentUser: { color: '#f5f5f7', fontWeight: '700', fontSize: 13 },
  commentDate: { color: '#8e8e93', fontSize: 11 },
  commentText: { color: '#f5f5f7', fontSize: 14, marginTop: 2 },
  inputRow: {
    flexDirection: 'row', gap: 10, padding: 12,
    borderTopWidth: 1, borderTopColor: '#2c2c2e', alignItems: 'flex-end',
  },
  input: {
    flex: 1, backgroundColor: '#1c1c1e', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, color: '#f5f5f7', fontSize: 14, maxHeight: 100,
  },
  sendButton: { backgroundColor: '#fc4c02', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  sendText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});