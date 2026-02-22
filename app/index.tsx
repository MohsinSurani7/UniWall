import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
import { useUniversity } from '@/contexts/UniversityContext';
import OnboardingScreen from '@/components/OnboardingScreen';
import MainApp from '@/components/MainApp';

export default function Index() {
  const { university, tosAccepted, isLoading } = useUniversity();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.dark.primary} size="large" />
      </View>
    );
  }

  if (!university || !tosAccepted) {
    return <OnboardingScreen />;
  }

  return <MainApp />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
