import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, Modal, StyleSheet,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Colors from '@/constants/colors';
import { fetchComments, createComment } from '@/lib/api';
import { useUniversity } from '@/contexts/UniversityContext';
import type { Post, Comment } from '@/shared/schema';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

interface CommentSheetProps {
  post: Post | null;
  visible: boolean;
  onClose: () => void;
}

export default function CommentSheet({ post, visible, onClose }: CommentSheetProps) {
  const [text, setText] = useState('');
  const { displayName } = useUniversity();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  const { data: comments, isLoading } = useQuery<Comment[]>({
    queryKey: ['comments', post?.id],
    queryFn: () => fetchComments(post!.id),
    enabled: !!post && visible,
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: () => createComment(post!.id, text.trim(), displayName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', post?.id] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setText('');
    },
  });

  const handleSend = () => {
    if (!text.trim() || !post) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendMutation.mutate();
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentRow}>
      <View style={styles.commentAvatar}>
        <Ionicons name="person" size={12} color={Colors.dark.accent} />
      </View>
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentName}>{item.displayName}</Text>
          <Text style={styles.commentTime}>{timeAgo(item.createdAt)}</Text>
        </View>
        <Text style={styles.commentText}>{item.text}</Text>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom + webBottomInset, 16) }]}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Comments</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={Colors.dark.textSecondary} />
            </Pressable>
          </View>

          {post && (
            <View style={styles.postPreview}>
              <Text style={styles.postPreviewName}>{post.displayName}</Text>
              <Text style={styles.postPreviewText} numberOfLines={2}>{post.text}</Text>
            </View>
          )}

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={Colors.dark.primary} />
            </View>
          ) : (
            <FlatList
              data={comments ?? []}
              keyExtractor={item => item.id}
              renderItem={renderComment}
              contentContainerStyle={styles.commentList}
              showsVerticalScrollIndicator={false}
              scrollEnabled={!!(comments && comments.length > 0)}
              ListEmptyComponent={
                <View style={styles.emptyComments}>
                  <Ionicons name="chatbubble-outline" size={28} color={Colors.dark.textMuted} />
                  <Text style={styles.emptyText}>No comments yet</Text>
                  <Text style={styles.emptySubText}>Be the first to reply</Text>
                </View>
              }
            />
          )}

          <View style={styles.inputBar}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Write a reply..."
                placeholderTextColor={Colors.dark.textMuted}
                value={text}
                onChangeText={setText}
                maxLength={200}
                multiline
              />
              <Pressable
                onPress={handleSend}
                disabled={!text.trim() || sendMutation.isPending}
                style={[styles.sendBtn, !!text.trim() && styles.sendBtnActive]}
              >
                <Ionicons
                  name="send"
                  size={18}
                  color={text.trim() ? '#fff' : Colors.dark.textMuted}
                />
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: Colors.dark.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    minHeight: 300,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.dark.textMuted,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: Colors.dark.text,
  },
  postPreview: {
    marginHorizontal: 20,
    padding: 12,
    backgroundColor: Colors.dark.background,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.dark.primary,
  },
  postPreviewName: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
    color: Colors.dark.primary,
    marginBottom: 2,
  },
  postPreviewText: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: Colors.dark.textSecondary,
    lineHeight: 18,
  },
  loadingContainer: {
    paddingTop: 40,
    alignItems: 'center',
  },
  commentList: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 12,
  },
  commentRow: {
    flexDirection: 'row',
    gap: 10,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.dark.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  commentContent: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    borderRadius: 12,
    padding: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  commentName: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
    color: Colors.dark.text,
  },
  commentTime: {
    fontSize: 10,
    fontFamily: 'Outfit_400Regular',
    color: Colors.dark.textMuted,
  },
  commentText: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: Colors.dark.textSecondary,
    lineHeight: 18,
  },
  emptyComments: {
    alignItems: 'center',
    paddingTop: 30,
    gap: 6,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
    color: Colors.dark.textSecondary,
  },
  emptySubText: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: Colors.dark.textMuted,
  },
  inputBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.dark.background,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  textInput: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    maxHeight: 80,
    paddingVertical: 2,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.dark.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: Colors.dark.primary,
  },
});
