import React, { useState } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Colors from '@/constants/colors';
import { useUniversity } from '@/contexts/UniversityContext';
import {
  fetchUserChats, fetchChatMessages, sendMessage,
  fetchUsersInUniversity, createChat,
} from '@/lib/api';
import type { Chat, Message, UserProfile } from '@/shared/schema';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function InboxScreen() {
  const { userId, university } = useUniversity();
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [msgText, setMsgText] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  const { data: chats, isLoading: chatsLoading } = useQuery<Chat[]>({
    queryKey: ['chats', userId],
    queryFn: () => fetchUserChats(userId!),
    enabled: !!userId,
    refetchInterval: 5000,
  });

  const { data: messages, isLoading: msgsLoading } = useQuery<Message[]>({
    queryKey: ['messages', activeChat?.id],
    queryFn: () => fetchChatMessages(activeChat!.id),
    enabled: !!activeChat,
    refetchInterval: 3000,
  });

  const { data: users } = useQuery<UserProfile[]>({
    queryKey: ['users', university],
    queryFn: () => fetchUsersInUniversity(university!),
    enabled: !!university && showNewChat,
  });

  const sendMut = useMutation({
    mutationFn: () => sendMessage(activeChat!.id, userId!, msgText.trim()),
    onSuccess: () => {
      setMsgText('');
      queryClient.invalidateQueries({ queryKey: ['messages', activeChat?.id] });
      queryClient.invalidateQueries({ queryKey: ['chats', userId] });
    },
  });

  const createChatMut = useMutation({
    mutationFn: (otherUserId: string) => createChat(userId!, otherUserId),
    onSuccess: (chat) => {
      setActiveChat(chat);
      setShowNewChat(false);
      queryClient.invalidateQueries({ queryKey: ['chats', userId] });
    },
  });

  const handleSend = () => {
    if (!msgText.trim() || !activeChat) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendMut.mutate();
  };

  if (!userId) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
        <View style={styles.emptyCenter}>
          <Ionicons name="chatbubbles-outline" size={48} color={Colors.dark.textMuted} />
          <Text style={styles.emptyTitle}>Inbox</Text>
          <Text style={styles.emptyText}>Register to start messaging other students</Text>
        </View>
      </View>
    );
  }

  if (activeChat) {
    const otherParticipant = activeChat.participants.find(p => p !== userId) || 'Anonymous';
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <View style={[styles.chatHeader, { paddingTop: insets.top + webTopInset + 12 }]}>
          <Pressable onPress={() => setActiveChat(null)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.dark.text} />
          </Pressable>
          <View style={styles.chatHeaderInfo}>
            <View style={styles.chatAvatar}>
              <Ionicons name="person" size={16} color={Colors.dark.accent} />
            </View>
            <View>
              <Text style={styles.chatHeaderName}>{otherParticipant.slice(0, 8)}...</Text>
              <Text style={styles.chatHeaderSub}>Messages auto-delete in 24h</Text>
            </View>
          </View>
        </View>

        {msgsLoading ? (
          <View style={styles.emptyCenter}>
            <ActivityIndicator color={Colors.dark.primary} />
          </View>
        ) : (
          <FlatList
            data={messages ?? []}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.msgList}
            showsVerticalScrollIndicator={false}
            scrollEnabled={!!(messages && messages.length > 0)}
            inverted
            ListEmptyComponent={
              <View style={styles.emptyCenter}>
                <Ionicons name="lock-closed" size={28} color={Colors.dark.textMuted} />
                <Text style={styles.emptyText}>Messages disappear after 24 hours</Text>
              </View>
            }
            renderItem={({ item }) => {
              const isMe = item.senderId === userId;
              return (
                <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
                  <View style={[styles.msgBubble, isMe ? styles.msgBubbleMe : styles.msgBubbleOther]}>
                    <Text style={[styles.msgText, isMe && styles.msgTextMe]}>{item.text}</Text>
                    <Text style={[styles.msgTime, isMe && styles.msgTimeMe]}>{timeAgo(item.createdAt)}</Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom + webBottomInset, 12) }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor={Colors.dark.textMuted}
              value={msgText}
              onChangeText={setMsgText}
              multiline
              maxLength={500}
            />
            <Pressable
              onPress={handleSend}
              disabled={!msgText.trim() || sendMut.isPending}
              style={[styles.sendBtn, !!msgText.trim() && styles.sendBtnActive]}
            >
              <Ionicons name="send" size={18} color={msgText.trim() ? '#fff' : Colors.dark.textMuted} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (showNewChat) {
    const otherUsers = (users ?? []).filter(u => u.id !== userId);
    return (
      <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
        <View style={styles.screenHeader}>
          <Pressable onPress={() => setShowNewChat(false)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.dark.text} />
          </Pressable>
          <Text style={styles.screenTitle}>New Chat</Text>
        </View>
        <FlatList
          data={otherUsers}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.userList}
          showsVerticalScrollIndicator={false}
          scrollEnabled={otherUsers.length > 0}
          ListEmptyComponent={
            <View style={styles.emptyCenter}>
              <Ionicons name="people-outline" size={28} color={Colors.dark.textMuted} />
              <Text style={styles.emptyText}>No other users from your campus yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => createChatMut.mutate(item.id)} style={styles.userRow}>
              <View style={styles.userAvatar}>
                <Ionicons name="person" size={16} color={Colors.dark.primary} />
              </View>
              <View>
                <Text style={styles.userName}>{item.displayName}</Text>
                <Text style={styles.userGender}>{item.gender}</Text>
              </View>
            </Pressable>
          )}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Inbox</Text>
        <Pressable onPress={() => setShowNewChat(true)} style={styles.newChatBtn}>
          <Ionicons name="create-outline" size={20} color={Colors.dark.primary} />
        </Pressable>
      </View>

      {chatsLoading ? (
        <View style={styles.emptyCenter}>
          <ActivityIndicator color={Colors.dark.primary} />
        </View>
      ) : (
        <FlatList
          data={chats ?? []}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!(chats && chats.length > 0)}
          ListEmptyComponent={
            <View style={styles.emptyCenter}>
              <Ionicons name="chatbubbles-outline" size={48} color={Colors.dark.textMuted} />
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptyText}>Start a conversation with someone on your campus</Text>
              <Pressable onPress={() => setShowNewChat(true)} style={styles.startChatBtn}>
                <Text style={styles.startChatText}>Start Chat</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => {
            const other = item.participants.find(p => p !== userId) || 'User';
            return (
              <Pressable onPress={() => setActiveChat(item)} style={styles.chatRow}>
                <View style={styles.chatAvatar}>
                  <Ionicons name="person" size={16} color={Colors.dark.accent} />
                </View>
                <View style={styles.chatInfo}>
                  <View style={styles.chatTop}>
                    <Text style={styles.chatName}>{other.slice(0, 8)}...</Text>
                    {item.lastMessageAt && (
                      <Text style={styles.chatTime}>{timeAgo(item.lastMessageAt)}</Text>
                    )}
                  </View>
                  <Text style={styles.chatPreview} numberOfLines={1}>
                    {item.lastMessage || 'No messages yet'}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  screenTitle: {
    fontSize: 22,
    fontFamily: 'Outfit_800ExtraBold',
    color: Colors.dark.text,
  },
  newChatBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: Colors.dark.text,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: Colors.dark.textMuted,
    textAlign: 'center',
  },
  startChatBtn: {
    marginTop: 12,
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  startChatText: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#fff',
  },
  chatList: {
    paddingTop: 8,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  chatAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.dark.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatInfo: {
    flex: 1,
  },
  chatTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
    color: Colors.dark.text,
  },
  chatTime: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
    color: Colors.dark.textMuted,
  },
  chatPreview: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    gap: 4,
  },
  chatHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chatHeaderName: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: Colors.dark.text,
  },
  chatHeaderSub: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
    color: Colors.dark.textMuted,
  },
  msgList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  msgRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  msgRowMe: {
    justifyContent: 'flex-end',
  },
  msgBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  msgBubbleMe: {
    backgroundColor: Colors.dark.primary,
    borderBottomRightRadius: 4,
  },
  msgBubbleOther: {
    backgroundColor: Colors.dark.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  msgText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: Colors.dark.text,
    lineHeight: 20,
  },
  msgTextMe: {
    color: '#fff',
  },
  msgTime: {
    fontSize: 10,
    fontFamily: 'Outfit_400Regular',
    color: Colors.dark.textMuted,
    marginTop: 4,
    textAlign: 'right',
  },
  msgTimeMe: {
    color: 'rgba(255,255,255,0.7)',
  },
  inputBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    backgroundColor: Colors.dark.background,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.dark.surface,
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
  userList: {
    paddingTop: 8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
    color: Colors.dark.text,
  },
  userGender: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: Colors.dark.textMuted,
  },
});
