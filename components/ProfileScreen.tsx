import React, { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, Platform, ScrollView, Alert,
  Image, TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useUniversity } from '@/contexts/UniversityContext';
import { INSTITUTIONS } from '@/constants/universities';
import { updateUserProfile } from '@/lib/api';

export default function ProfileScreen() {
  const { university, displayName, gender, secretKey, userId, clearAll } = useUniversity();
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [isSavingBio, setIsSavingBio] = useState(false);

  const institution = INSTITUTIONS.find(i => i.id === university);

  const handleTakePhoto = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Camera', 'Camera capture is only available on mobile devices.');
      return;
    }
    if (!userId) return;

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera access is needed to take a profile photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const base64Uri = `data:image/jpeg;base64,${asset.base64}`;
      setIsSavingPhoto(true);
      try {
        await updateUserProfile(userId, { profilePhoto: base64Uri });
        setProfilePhoto(base64Uri);
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        Alert.alert('Error', 'Failed to save profile photo.');
      } finally {
        setIsSavingPhoto(false);
      }
    }
  };

  const handleEditBio = () => {
    setBioText(bio);
    setIsEditingBio(true);
  };

  const handleSaveBio = async () => {
    if (!userId) return;
    const trimmed = bioText.trim();
    setIsSavingBio(true);
    try {
      await updateUserProfile(userId, { bio: trimmed });
      setBio(trimmed);
      setIsEditingBio(false);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Error', 'Failed to save bio.');
    } finally {
      setIsSavingBio(false);
    }
  };

  const handleCancelBio = () => {
    setBioText(bio);
    setIsEditingBio(false);
  };

  const handleLogout = () => {
    const doLogout = () => {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      clearAll();
    };
    if (Platform.OS === 'web') {
      doLogout();
    } else {
      Alert.alert('Switch Campus', 'This will reset your profile. Continue?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Switch', style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  const genderIcon = gender === 'male' ? 'male' : gender === 'female' ? 'female' : 'transgender';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.contentContainer, {
        paddingTop: insets.top + webTopInset + 20,
        paddingBottom: insets.bottom + webBottomInset + 20,
      }]}
    >
      <Text style={styles.title}>Profile</Text>

      <View style={styles.profileCard}>
        <LinearGradient
          colors={['rgba(168,85,247,0.2)', 'rgba(168,85,247,0.05)']}
          style={styles.profileGradient}
        >
          <Pressable onPress={handleTakePhoto} style={styles.avatarWrapper}>
            {isSavingPhoto ? (
              <View style={styles.avatarLarge}>
                <ActivityIndicator size="small" color={Colors.dark.primary} />
              </View>
            ) : profilePhoto ? (
              <View style={styles.avatarLarge}>
                <Image source={{ uri: profilePhoto }} style={styles.avatarImage} />
                <View style={styles.avatarOverlay}>
                  <Ionicons name="camera" size={16} color="#fff" />
                </View>
              </View>
            ) : (
              <View style={styles.avatarLarge}>
                <Ionicons name="person" size={32} color={Colors.dark.primary} />
                <View style={styles.avatarOverlay}>
                  <Ionicons name="camera" size={16} color="#fff" />
                </View>
              </View>
            )}
            {Platform.OS === 'web' && (
              <Text style={styles.cameraNote}>Camera is mobile-only</Text>
            )}
          </Pressable>
          <Text style={styles.profileName}>{displayName}</Text>
          {bio ? (
            <Text style={styles.bioDisplay}>{bio}</Text>
          ) : null}
          <View style={styles.genderBadge}>
            <Ionicons name={genderIcon as any} size={14} color={Colors.dark.accent} />
            <Text style={styles.genderText}>{gender || 'Not set'}</Text>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.bioSection}>
        <View style={styles.bioHeader}>
          <Text style={styles.bioTitle}>Bio</Text>
          {!isEditingBio && (
            <Pressable onPress={handleEditBio} hitSlop={8}>
              <Ionicons name="pencil" size={18} color={Colors.dark.primary} />
            </Pressable>
          )}
        </View>
        {isEditingBio ? (
          <View style={styles.bioEditContainer}>
            <TextInput
              style={styles.bioInput}
              value={bioText}
              onChangeText={setBioText}
              placeholder="Write something about yourself..."
              placeholderTextColor={Colors.dark.textMuted}
              maxLength={150}
              multiline
              autoFocus
            />
            <Text style={styles.bioCharCount}>{bioText.length}/150</Text>
            <View style={styles.bioActions}>
              <Pressable onPress={handleCancelBio} style={styles.bioCancelBtn}>
                <Ionicons name="close" size={20} color={Colors.dark.textMuted} />
              </Pressable>
              <Pressable onPress={handleSaveBio} style={styles.bioSaveBtn} disabled={isSavingBio}>
                {isSavingBio ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="checkmark" size={20} color="#fff" />
                )}
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable onPress={handleEditBio}>
            <Text style={bio ? styles.bioText : styles.bioPlaceholder}>
              {bio || 'Tap to add a bio...'}
            </Text>
          </Pressable>
        )}
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Ionicons name="school" size={18} color={Colors.dark.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Campus</Text>
            <Text style={styles.infoValue}>{institution?.fullName || university}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Ionicons name="globe" size={18} color={Colors.dark.accent} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Country</Text>
            <Text style={styles.infoValue}>{institution?.country || 'Unknown'}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Ionicons name="shield-checkmark" size={18} color={Colors.dark.success} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Identity</Text>
            <Text style={styles.infoValue}>Anonymous by default</Text>
          </View>
        </View>
        {secretKey ? (
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <View style={styles.infoIcon}>
              <Ionicons name="key" size={18} color={Colors.dark.heat} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Secret Key</Text>
              <Text style={[styles.infoValue, { fontSize: 12, letterSpacing: 1 }]}>{secretKey}</Text>
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.aboutSection}>
        <Text style={styles.aboutTitle}>About UniWall</Text>
        <View style={styles.aboutItem}>
          <Ionicons name="information-circle" size={16} color={Colors.dark.textMuted} />
          <Text style={styles.aboutText}>
            This is an unofficial app not affiliated with any educational institution.
          </Text>
        </View>
        <View style={styles.aboutItem}>
          <Ionicons name="lock-closed" size={16} color={Colors.dark.textMuted} />
          <Text style={styles.aboutText}>
            Your data is stored securely. Chat messages auto-delete after 24 hours.
          </Text>
        </View>
        <View style={styles.aboutItem}>
          <Ionicons name="camera" size={16} color={Colors.dark.textMuted} />
          <Text style={styles.aboutText}>
            Only real-time camera captures are allowed for photos.
          </Text>
        </View>
      </View>

      <Pressable onPress={handleLogout} style={styles.logoutBtn}>
        <Ionicons name="exit-outline" size={20} color={Colors.dark.danger} />
        <Text style={styles.logoutText}>Switch Campus</Text>
      </Pressable>

      <Text style={styles.version}>UniWall v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Outfit_800ExtraBold',
    color: Colors.dark.text,
    marginBottom: 20,
  },
  profileCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  profileGradient: {
    paddingVertical: 28,
    alignItems: 'center',
    gap: 10,
  },
  avatarWrapper: {
    alignItems: 'center',
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.dark.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.dark.primary,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 26,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraNote: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
    color: Colors.dark.textMuted,
    marginTop: 4,
  },
  profileName: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    color: Colors.dark.text,
  },
  bioDisplay: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  genderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.dark.accentMuted,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  genderText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: Colors.dark.accent,
    textTransform: 'capitalize',
  },
  bioSection: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  bioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bioTitle: {
    fontSize: 15,
    fontFamily: 'Outfit_700Bold',
    color: Colors.dark.text,
  },
  bioText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: Colors.dark.textSecondary,
    lineHeight: 20,
  },
  bioPlaceholder: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: Colors.dark.textMuted,
    fontStyle: 'italic',
  },
  bioEditContainer: {
    gap: 8,
  },
  bioInput: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: Colors.dark.text,
    backgroundColor: Colors.dark.background,
    borderRadius: 10,
    padding: 12,
    minHeight: 60,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  bioCharCount: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
    color: Colors.dark.textMuted,
    textAlign: 'right',
  },
  bioActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  bioCancelBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bioSaveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.dark.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: Colors.dark.textMuted,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: Colors.dark.text,
    marginTop: 1,
  },
  aboutSection: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 12,
  },
  aboutTitle: {
    fontSize: 15,
    fontFamily: 'Outfit_700Bold',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  aboutItem: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  aboutText: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: Colors.dark.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.dark.dangerMuted,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
    color: Colors.dark.danger,
  },
  version: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: Colors.dark.textMuted,
    textAlign: 'center',
  },
});
