import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, Platform, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSequence, withSpring } from 'react-native-reanimated';
import { useQueryClient } from '@tanstack/react-query';
import Colors from '@/constants/colors';
import type { Post } from '../shared/schema';
import { voteOnPost, reportPost } from '@/lib/api';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface PostCardProps {
  post: Post;
  index: number;
  onComment: (post: Post) => void;
  onRefresh: () => void;
}

export default function PostCard({ post, index, onComment, onRefresh }: PostCardProps) {
  const [voted, setVoted] = useState<'up' | 'down' | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const queryClient = useQueryClient();
  const voteScale = useSharedValue(1);
  const voteStyle = useAnimatedStyle(() => ({ transform: [{ scale: voteScale.value }] }));

  const score = post.upvotes - post.downvotes;
  const heatColor = score > 20 ? Colors.dark.heat : score > 0 ? Colors.dark.primary : Colors.dark.textMuted;

  const handleVote = async (type: 'upvote' | 'downvote') => {
    const dir = type === 'upvote' ? 'up' : 'down';
    if (voted === dir) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    voteScale.value = withSequence(withSpring(1.15), withSpring(1));
    setVoted(dir);
    try {
      await voteOnPost(post.id, { type });
      onRefresh();
    } catch {}
  };

  const handleReport = () => {
    setMenuVisible(false);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const doReport = async () => {
      try {
        await reportPost(post.id);
        onRefresh();
      } catch {}
    };
    if (Platform.OS === 'web') {
      doReport();
    } else {
      Alert.alert('Report Post', 'Report this post for inappropriate content?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report', style: 'destructive', onPress: doReport },
      ]);
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 50).duration(300)}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={14} color={Colors.dark.primary} />
            </View>
            <View>
              <Text style={styles.name}>{post.displayName}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.tag}>{post.identityTag}</Text>
                <Text style={styles.dot}>·</Text>
                <Text style={styles.time}>{timeAgo(post.createdAt)}</Text>
              </View>
            </View>
          </View>
          <Pressable onPress={() => setMenuVisible(!menuVisible)} hitSlop={10}>
            <Ionicons name="ellipsis-horizontal" size={18} color={Colors.dark.textMuted} />
          </Pressable>
        </View>

        {menuVisible && (
          <View style={styles.menu}>
            <Pressable onPress={handleReport} style={styles.menuItem}>
              <Ionicons name="flag" size={16} color={Colors.dark.danger} />
              <Text style={styles.menuItemTextRed}>Report Post</Text>
            </Pressable>
            <Pressable onPress={() => setMenuVisible(false)} style={styles.menuItem}>
              <Ionicons name="close" size={16} color={Colors.dark.textMuted} />
              <Text style={styles.menuItemText}>Close</Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.text}>{post.text}</Text>

        {post.imageUri && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: post.imageUri }} style={styles.postImage} resizeMode="cover" />
          </View>
        )}

        <View style={styles.actions}>
          <Animated.View style={[styles.voteRow, voteStyle]}>
            <Pressable onPress={() => handleVote('upvote')} style={styles.voteBtn} hitSlop={8}>
              <Ionicons
                name={voted === 'up' ? 'arrow-up-circle' : 'arrow-up-circle-outline'}
                size={22}
                color={voted === 'up' ? Colors.dark.upvote : Colors.dark.textMuted}
              />
            </Pressable>
            <View style={[styles.heatBadge, { backgroundColor: score > 0 ? Colors.dark.primaryMuted : Colors.dark.dangerMuted }]}>
              <MaterialCommunityIcons name="fire" size={14} color={heatColor} />
              <Text style={[styles.heatText, { color: heatColor }]}>{score}</Text>
            </View>
            <Pressable onPress={() => handleVote('downvote')} style={styles.voteBtn} hitSlop={8}>
              <Ionicons
                name={voted === 'down' ? 'arrow-down-circle' : 'arrow-down-circle-outline'}
                size={22}
                color={voted === 'down' ? Colors.dark.downvote : Colors.dark.textMuted}
              />
            </Pressable>
          </Animated.View>

          <Pressable onPress={() => onComment(post)} style={styles.commentBtn}>
            <Ionicons name="chatbubble-outline" size={18} color={Colors.dark.accent} />
            <Text style={styles.commentCount}>{post.commentCount}</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.dark.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: Colors.dark.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tag: {
    fontSize: 11,
    fontFamily: 'Outfit_500Medium',
    color: Colors.dark.primary,
  },
  dot: {
    fontSize: 11,
    color: Colors.dark.textMuted,
  },
  time: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
    color: Colors.dark.textMuted,
  },
  menu: {
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: 12,
    padding: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  menuItemTextRed: {
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
    color: Colors.dark.danger,
  },
  menuItemText: {
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
    color: Colors.dark.textMuted,
  },
  text: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    color: Colors.dark.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  voteBtn: {
    padding: 4,
    borderRadius: 20,
  },
  heatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  heatText: {
    fontSize: 13,
    fontFamily: 'Outfit_700Bold',
  },
  commentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.dark.accentMuted,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  commentCount: {
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
    color: Colors.dark.accent,
  },
});
