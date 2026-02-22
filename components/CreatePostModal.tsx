import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, Modal, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Image, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { IDENTITY_TAGS, type IdentityTag } from '@/constants/universities';
import { containsBlacklistedWord } from '@/constants/blacklist';
import { useUniversity } from '@/contexts/UniversityContext';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (text: string, identityTag: string, displayName: string, imageUri?: string) => void;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export default function CreatePostModal({ visible, onClose, onSubmit }: CreatePostModalProps) {
  const [text, setText] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('Anonymous');
  const [error, setError] = useState('');
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);
  const { displayName } = useUniversity();
  const insets = useSafeAreaInsets();
  const shakeX = useSharedValue(0);
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  const charCount = text.length;
  const maxChars = 300;
  const isOverLimit = charCount > maxChars;

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const triggerShake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
  }, []);

  const handleCameraCapture = useCallback(async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Camera', 'Camera capture is available on mobile devices only.');
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.base64) {
        const mimeType = asset.mimeType || 'image/jpeg';
        setImageUri(`data:${mimeType};base64,${asset.base64}`);
      } else if (asset.uri) {
        setImageUri(asset.uri);
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleSubmit = () => {
    if (!text.trim()) return;
    if (containsBlacklistedWord(text)) {
      setError('Campus rules! Remove offensive language.');
      triggerShake();
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (isOverLimit) {
      setError('Post exceeds 300 character limit.');
      triggerShake();
      return;
    }
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSubmit(text.trim(), selectedTag, displayName, imageUri);
    setText('');
    setSelectedTag('Anonymous');
    setError('');
    setImageUri(undefined);
    onClose();
  };

  const handleClose = () => {
    setText('');
    setSelectedTag('Anonymous');
    setError('');
    setImageUri(undefined);
    onClose();
  };

  const charColor = isOverLimit ? Colors.dark.danger : charCount > 250 ? Colors.dark.heat : Colors.dark.textMuted;

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <AnimatedView style={[styles.sheet, shakeStyle, { paddingBottom: Math.max(insets.bottom + webBottomInset, 16) }]}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <Pressable onPress={handleClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={Colors.dark.textSecondary} />
            </Pressable>
            <Text style={styles.sheetTitle}>Drop on the Wall</Text>
            <Pressable
              onPress={handleSubmit}
              disabled={!text.trim() || isOverLimit}
              style={[styles.postButton, (!text.trim() || isOverLimit) && styles.postButtonDisabled]}
            >
              <Text style={[styles.postButtonText, (!text.trim() || isOverLimit) && styles.postButtonTextDisabled]}>
                Post
              </Text>
            </Pressable>
          </View>

          {!!error && (
            <View style={styles.errorContainer}>
              <Ionicons name="warning" size={16} color={Colors.dark.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.authorRow}>
            <View style={styles.authorAvatar}>
              <Ionicons name="person" size={12} color={Colors.dark.primary} />
            </View>
            <Text style={styles.authorName}>Posting as {displayName}</Text>
          </View>

          <TextInput
            style={styles.textInput}
            placeholder="What's the tea on campus..."
            placeholderTextColor={Colors.dark.textMuted}
            value={text}
            onChangeText={(val) => { setText(val); setError(''); }}
            multiline
            maxLength={350}
            autoFocus
            textAlignVertical="top"
          />

          <View style={styles.charCounter}>
            <Text style={[styles.charText, { color: charColor }]}>{charCount}/{maxChars}</Text>
          </View>

          {!!imageUri && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
              <Pressable style={styles.removeImageBtn} onPress={() => setImageUri(undefined)} hitSlop={8}>
                <Ionicons name="close-circle" size={24} color={Colors.dark.danger} />
              </Pressable>
            </View>
          )}

          <View style={styles.toolbar}>
            <Pressable onPress={handleCameraCapture} style={styles.toolbarBtn} hitSlop={8}>
              <Ionicons name="camera" size={22} color={Colors.dark.primary} />
            </Pressable>
            {Platform.OS === 'web' && (
              <Text style={styles.webCameraNote}>Camera capture is mobile only</Text>
            )}
          </View>

          <View style={styles.tagSection}>
            <Text style={styles.tagLabel}>Identify as...</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagScroll}>
              {IDENTITY_TAGS.map(tag => (
                <Pressable
                  key={tag}
                  onPress={() => setSelectedTag(tag)}
                  style={[styles.tagChip, selectedTag === tag && styles.tagChipActive]}
                >
                  <Text style={[styles.tagChipText, selectedTag === tag && styles.tagChipTextActive]}>
                    {tag}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </AnimatedView>
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
    paddingHorizontal: 20,
    paddingTop: 8,
    maxHeight: '85%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.dark.textMuted,
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 17,
    fontFamily: 'Outfit_700Bold',
    color: Colors.dark.text,
  },
  postButton: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonDisabled: {
    backgroundColor: Colors.dark.surfaceElevated,
  },
  postButtonText: {
    color: '#fff',
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
  },
  postButtonTextDisabled: {
    color: Colors.dark.textMuted,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.dark.dangerMuted,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  errorText: {
    color: Colors.dark.danger,
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
    flex: 1,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.dark.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorName: {
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
    color: Colors.dark.textSecondary,
  },
  textInput: {
    color: Colors.dark.text,
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    minHeight: 120,
    maxHeight: 200,
    textAlignVertical: 'top',
    lineHeight: 24,
  },
  charCounter: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  charText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
  },
  tagSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    paddingTop: 14,
  },
  tagLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
    marginBottom: 10,
  },
  tagScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.dark.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  tagChipActive: {
    backgroundColor: Colors.dark.primaryMuted,
    borderColor: Colors.dark.primary,
  },
  tagChipText: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
  },
  tagChipTextActive: {
    color: Colors.dark.primary,
  },
  imagePreviewContainer: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  toolbarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webCameraNote: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: Colors.dark.textMuted,
  },
});
