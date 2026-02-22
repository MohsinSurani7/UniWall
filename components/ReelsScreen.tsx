import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet,
  RefreshControl, ActivityIndicator, Platform, Dimensions,
  TextInput, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Colors from '@/constants/colors';
import { useUniversity } from '@/contexts/UniversityContext';
import { fetchReels, createReel, likeReel, viewReel } from '@/lib/api';
import type { Reel } from '../shared/schema';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function ReelCard({ reel, onLike }: { reel: Reel; onLike: (id: string) => void }) {
  const [liked, setLiked] = useState(false);

  const handleLike = () => {
    if (liked) return;
    setLiked(true);
    onLike(reel.id);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <View style={reelStyles.card}>
      <LinearGradient
        colors={['rgba(168,85,247,0.15)', 'rgba(168,85,247,0.03)']}
        style={reelStyles.videoPlaceholder}
      >
        <View style={reelStyles.playIcon}>
          <Ionicons name="play" size={40} color={Colors.dark.primary} />
        </View>
        <View style={reelStyles.durationBadge}>
          <Ionicons name="time-outline" size={12} color="#fff" />
          <Text style={reelStyles.durationText}>{formatDuration(reel.duration)}</Text>
        </View>
      </LinearGradient>

      <View style={reelStyles.cardContent}>
        <View style={reelStyles.cardHeader}>
          <View style={reelStyles.authorRow}>
            <View style={reelStyles.avatar}>
              <Ionicons name="person" size={14} color={Colors.dark.primary} />
            </View>
            <Text style={reelStyles.authorName}>{reel.displayName}</Text>
          </View>
          <Text style={reelStyles.timeText}>{timeAgo(reel.createdAt)}</Text>
        </View>
        {reel.caption ? (
          <Text style={reelStyles.caption} numberOfLines={2}>{reel.caption}</Text>
        ) : null}
        <View style={reelStyles.statsRow}>
          <Pressable onPress={handleLike} style={reelStyles.statBtn}>
            <Ionicons name={liked ? "heart" : "heart-outline"} size={18} color={liked ? Colors.dark.danger : Colors.dark.textMuted} />
            <Text style={[reelStyles.statText, liked && { color: Colors.dark.danger }]}>{reel.likes + (liked ? 1 : 0)}</Text>
          </Pressable>
          <View style={reelStyles.statBtn}>
            <Ionicons name="eye-outline" size={18} color={Colors.dark.textMuted} />
            <Text style={reelStyles.statText}>{reel.views}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function ReelsScreen() {
  const { university, userId, displayName } = useUniversity();
  const [showUpload, setShowUpload] = useState(false);
  const [caption, setCaption] = useState('');
  const [uploadDuration, setUploadDuration] = useState('');
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const { data: reels, isLoading, isRefetching, refetch } = useQuery<Reel[]>({
    queryKey: ['reels', university],
    queryFn: () => fetchReels(university!),
    enabled: !!university,
    refetchInterval: 15000,
  });

  const likeMutation = useMutation({
    mutationFn: likeReel,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reels', university] }),
  });

  const uploadMutation = useMutation({
    mutationFn: (data: { caption: string; duration: number }) =>
      createReel({
        userId: userId || 'anon',
        displayName: displayName || 'Anonymous',
        university: university!,
        caption: data.caption,
        duration: data.duration,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reels', university] });
      setShowUpload(false);
      setCaption('');
      setUploadDuration('');
    },
  });

  const handleUploadSubmit = () => {
    const dur = parseInt(uploadDuration) || 30;
    if (dur > 180) {
      return;
    }
    uploadMutation.mutate({ caption, duration: dur });
  };

  const handleLike = useCallback((id: string) => {
    likeMutation.mutate(id);
  }, []);

  return (
    <View style={reelStyles.container}>
      <View style={[reelStyles.header, { paddingTop: insets.top + webTopInset + 12 }]}>
        <View style={reelStyles.headerLeft}>
          <View style={reelStyles.logoContainer}>
            <Ionicons name="videocam" size={22} color={Colors.dark.primary} />
          </View>
          <Text style={reelStyles.headerTitle}>Reels</Text>
        </View>
        <Pressable
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowUpload(true);
          }}
          style={reelStyles.uploadBtn}
        >
          <Ionicons name="add-circle" size={24} color={Colors.dark.primary} />
        </Pressable>
      </View>

      <FlatList
        data={reels ?? []}
        renderItem={({ item }) => <ReelCard reel={item} onLike={handleLike} />}
        keyExtractor={item => item.id}
        contentContainerStyle={reelStyles.listContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!(reels && reels.length > 0)}
        ListEmptyComponent={
          isLoading ? (
            <View style={reelStyles.emptyContainer}>
              <ActivityIndicator color={Colors.dark.primary} size="large" />
              <Text style={reelStyles.emptyText}>Loading reels...</Text>
            </View>
          ) : (
            <View style={reelStyles.emptyContainer}>
              <Ionicons name="videocam-off-outline" size={48} color={Colors.dark.textMuted} />
              <Text style={reelStyles.emptyTitle}>No reels yet</Text>
              <Text style={reelStyles.emptyText}>Be the first to upload a reel</Text>
            </View>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.dark.primary}
            colors={[Colors.dark.primary]}
          />
        }
      />

      <Modal
        visible={showUpload}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUpload(false)}
      >
        <View style={reelStyles.modalOverlay}>
          <View style={reelStyles.modalContent}>
            <View style={reelStyles.modalHeader}>
              <Text style={reelStyles.modalTitle}>Upload Reel</Text>
              <Pressable onPress={() => setShowUpload(false)}>
                <Ionicons name="close" size={24} color={Colors.dark.textMuted} />
              </Pressable>
            </View>

            <View style={reelStyles.uploadArea}>
              <LinearGradient
                colors={['rgba(168,85,247,0.15)', 'rgba(168,85,247,0.05)']}
                style={reelStyles.uploadZone}
              >
                <Ionicons name="cloud-upload" size={40} color={Colors.dark.primary} />
                <Text style={reelStyles.uploadZoneText}>Video uploads are captured via camera</Text>
                <Text style={reelStyles.uploadZoneSubtext}>Max 3 minutes</Text>
              </LinearGradient>
            </View>

            <View style={reelStyles.formGroup}>
              <Text style={reelStyles.formLabel}>Caption</Text>
              <TextInput
                style={reelStyles.formInput}
                placeholder="What's this reel about?"
                placeholderTextColor={Colors.dark.textMuted}
                value={caption}
                onChangeText={setCaption}
                maxLength={200}
                multiline
              />
            </View>

            <View style={reelStyles.formGroup}>
              <Text style={reelStyles.formLabel}>Duration (seconds)</Text>
              <TextInput
                style={reelStyles.formInput}
                placeholder="e.g. 30 (max 180)"
                placeholderTextColor={Colors.dark.textMuted}
                value={uploadDuration}
                onChangeText={setUploadDuration}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>

            <Pressable
              onPress={handleUploadSubmit}
              disabled={uploadMutation.isPending}
              style={reelStyles.submitBtn}
            >
              <LinearGradient
                colors={['#A855F7', '#7C3AED']}
                style={reelStyles.submitGradient}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={reelStyles.submitText}>
                  {uploadMutation.isPending ? 'Uploading...' : 'Upload Reel'}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const reelStyles = StyleSheet.create({
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
  uploadBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  videoPlaceholder: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
  },
  cardContent: {
    padding: 14,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.dark.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorName: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: Colors.dark.text,
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: Colors.dark.textMuted,
  },
  caption: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: Colors.dark.textSecondary,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
    color: Colors.dark.textMuted,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.dark.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    color: Colors.dark.text,
  },
  uploadArea: {
    marginBottom: 16,
  },
  uploadZone: {
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderStyle: 'dashed',
  },
  uploadZoneText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: Colors.dark.textSecondary,
  },
  uploadZoneSubtext: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: Colors.dark.textMuted,
  },
  formGroup: {
    marginBottom: 14,
  },
  formLabel: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
    color: Colors.dark.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: Colors.dark.background,
    borderRadius: 12,
    padding: 12,
    color: Colors.dark.text,
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  submitBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  submitText: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
    color: '#fff',
  },
});
