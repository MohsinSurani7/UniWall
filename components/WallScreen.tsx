import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet,
  RefreshControl, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Colors from '@/constants/colors';
import { INSTITUTIONS } from '@/constants/universities';
import { useUniversity } from '@/contexts/UniversityContext';
import { fetchPosts, createPost } from '@/lib/api';
import PostCard from './PostCard';
import CreatePostModal from './CreatePostModal';
import CommentSheet from './CommentSheet';
import { AdBanner, FeedAd } from './AdBanner';
import type { Post } from '../shared/schema';

export default function WallScreen() {
  const { university, clearAll } = useUniversity();
  const [modalVisible, setModalVisible] = useState(false);
  const [commentPost, setCommentPost] = useState<Post | null>(null);
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const institution = INSTITUTIONS.find(i => i.id === university);
  const uniName = institution?.name ?? university ?? '';

  const { data: posts, isLoading, refetch, isRefetching } = useQuery<Post[]>({
    queryKey: ['posts', university],
    queryFn: () => fetchPosts(university!),
    enabled: !!university,
    refetchInterval: 10000,
  });

  const createMutation = useMutation({
    mutationFn: (input: { text: string; identityTag: string; displayName: string; imageUri?: string }) =>
      createPost({ text: input.text, university: university!, identityTag: input.identityTag, displayName: input.displayName, imageUri: input.imageUri }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', university] });
    },
  });

  const handleCreatePost = useCallback((text: string, identityTag: string, displayName: string, imageUri?: string) => {
    createMutation.mutate({ text, identityTag, displayName, imageUri });
  }, [university]);

  const handleComment = useCallback((post: Post) => {
    setCommentPost(post);
  }, []);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['posts', university] });
  }, [university]);

  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const renderPost = useCallback(({ item, index }: { item: Post; index: number }) => (
    <View>
      <PostCard post={item} index={index} onComment={handleComment} onRefresh={handleRefresh} />
      {index === 2 && <FeedAd />}
    </View>
  ), [handleComment, handleRefresh]);

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + webTopInset + 12 }]}>
      <View style={styles.headerLeft}>
        <View style={styles.logoContainer}>
          <MaterialCommunityIcons name="wall" size={24} color={Colors.dark.primary} />
        </View>
        <View>
          <Text style={styles.headerTitle}>UniWall</Text>
          <Pressable onPress={clearAll} style={styles.uniTag}>
            <Ionicons name="school" size={12} color={Colors.dark.accent} />
            <Text style={styles.uniTagText}>{uniName}</Text>
            <Ionicons name="chevron-down" size={10} color={Colors.dark.textMuted} />
          </Pressable>
        </View>
      </View>
      <Pressable onPress={() => refetch()} style={styles.refreshBtn}>
        <Ionicons name="refresh" size={20} color={Colors.dark.textSecondary} />
      </Pressable>
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator color={Colors.dark.primary} size="large" />
          <Text style={styles.emptyText}>Loading the wall...</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="wall" size={48} color={Colors.dark.textMuted} />
        <Text style={styles.emptyTitle}>The wall is empty</Text>
        <Text style={styles.emptyText}>Be the first to drop something</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderHeader()}

      <FlatList
        data={posts ?? []}
        renderItem={renderPost}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        scrollEnabled={!!(posts && posts.length > 0)}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.dark.primary}
            colors={[Colors.dark.primary]}
          />
        }
      />

      <View style={styles.fabContainer}>
        <Pressable
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setModalVisible(true);
          }}
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        >
          <LinearGradient
            colors={['#A855F7', '#7C3AED']}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </LinearGradient>
        </Pressable>
      </View>

      <CreatePostModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleCreatePost}
      />

      <CommentSheet
        post={commentPost}
        visible={!!commentPost}
        onClose={() => setCommentPost(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.dark.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Outfit_800ExtraBold',
    color: Colors.dark.text,
  },
  uniTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  uniTagText: {
    color: Colors.dark.accent,
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingTop: 14,
    paddingBottom: 90,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    gap: 10,
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
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
  fab: {
    borderRadius: 28,
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.95 }],
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
