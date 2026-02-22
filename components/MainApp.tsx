import React, { useState } from 'react';
import { View, Pressable, StyleSheet, Platform, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import WallScreen from './WallScreen';
import InboxScreen from './InboxScreen';
import ReelsScreen from './ReelsScreen';
import ProfileScreen from './ProfileScreen';

type TabId = 'wall' | 'reels' | 'inbox' | 'profile';

const TABS: { id: TabId; icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { id: 'wall', icon: 'flame-outline', iconActive: 'flame', label: 'Wall' },
  { id: 'reels', icon: 'videocam-outline', iconActive: 'videocam', label: 'Reels' },
  { id: 'inbox', icon: 'chatbubbles-outline', iconActive: 'chatbubbles', label: 'Inbox' },
  { id: 'profile', icon: 'person-outline', iconActive: 'person', label: 'Profile' },
];

export default function MainApp() {
  const [activeTab, setActiveTab] = useState<TabId>('wall');
  const insets = useSafeAreaInsets();
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {activeTab === 'wall' && <WallScreen />}
        {activeTab === 'reels' && <ReelsScreen />}
        {activeTab === 'inbox' && <InboxScreen />}
        {activeTab === 'profile' && <ProfileScreen />}
      </View>
      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, webBottomInset) }]}>
        {TABS.map(tab => (
          <Pressable
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={styles.tabItem}
          >
            <View style={[styles.tabIconContainer, activeTab === tab.id && styles.tabIconActive]}>
              <Ionicons
                name={activeTab === tab.id ? tab.iconActive : tab.icon}
                size={22}
                color={activeTab === tab.id ? Colors.dark.primary : Colors.dark.tabIconDefault}
              />
            </View>
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.background,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    paddingTop: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  tabIconContainer: {
    width: 40,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconActive: {
    backgroundColor: Colors.dark.primaryMuted,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: 'Outfit_500Medium',
    color: Colors.dark.tabIconDefault,
  },
  tabLabelActive: {
    color: Colors.dark.primary,
  },
});
