import React from 'react';
import { View, Text, Pressable, StyleSheet, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import Colors from '@/constants/colors';
import { useUniversity } from '@/contexts/UniversityContext';
import { fetchAds } from '@/lib/api';
import type { Ad } from '../shared/schema';

export function AdBanner({ placement }: { placement: string }) {
  const { university } = useUniversity();

  const { data: ads } = useQuery<Ad[]>({
    queryKey: ['ads', placement, university],
    queryFn: () => fetchAds(placement, university || undefined),
    refetchInterval: 60000,
  });

  if (!ads || ads.length === 0) return null;

  const ad = ads[0];

  const handlePress = () => {
    if (ad.linkUrl) {
      Linking.openURL(ad.linkUrl).catch(() => {});
    }
  };

  if (ad.type === 'banner' || ad.type === 'photo') {
    return (
      <Pressable onPress={handlePress} style={styles.bannerContainer}>
        {ad.imageUri ? (
          <Image source={{ uri: ad.imageUri }} style={styles.bannerImage} resizeMode="cover" />
        ) : (
          <LinearGradient colors={['rgba(168,85,247,0.2)', 'rgba(168,85,247,0.05)']} style={styles.bannerPlaceholder}>
            <Ionicons name="megaphone" size={20} color={Colors.dark.primary} />
            <Text style={styles.bannerTitle}>{ad.title}</Text>
          </LinearGradient>
        )}
        <View style={styles.adLabel}>
          <Text style={styles.adLabelText}>Ad</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={handlePress} style={styles.bannerContainer}>
      <LinearGradient colors={['rgba(168,85,247,0.15)', 'rgba(34,211,238,0.1)']} style={styles.bannerPlaceholder}>
        <Ionicons name="megaphone" size={20} color={Colors.dark.primary} />
        <Text style={styles.bannerTitle}>{ad.title}</Text>
        {ad.linkUrl && (
          <View style={styles.learnMore}>
            <Text style={styles.learnMoreText}>Learn more</Text>
            <Ionicons name="arrow-forward" size={14} color={Colors.dark.accent} />
          </View>
        )}
      </LinearGradient>
      <View style={styles.adLabel}>
        <Text style={styles.adLabelText}>Ad</Text>
      </View>
    </Pressable>
  );
}

export function FeedAd() {
  return <AdBanner placement="feed" />;
}

const styles = StyleSheet.create({
  bannerContainer: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  bannerImage: {
    width: '100%',
    height: 80,
  },
  bannerPlaceholder: {
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  bannerTitle: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: Colors.dark.text,
    textAlign: 'center',
  },
  adLabel: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adLabelText: {
    fontSize: 9,
    fontFamily: 'Outfit_600SemiBold',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  learnMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  learnMoreText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: Colors.dark.accent,
  },
});
