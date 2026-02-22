import React, { useState, useMemo } from 'react';
import {
  View, Text, Pressable, StyleSheet, TextInput,
  Platform, FlatList, ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { INSTITUTIONS, COUNTRIES, type Gender, type Institution } from '@/constants/universities';
import { useUniversity } from '@/contexts/UniversityContext';
import { registerUser, loginUser } from '@/lib/api';

type Step = 'tos' | 'mode' | 'profile' | 'university' | 'secretkey' | 'login';

export default function OnboardingScreen() {
  const [step, setStep] = useState<Step>('tos');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [selectedUni, setSelectedUni] = useState<Institution | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [generatedKey, setGeneratedKey] = useState('');
  const [loginKey, setLoginKey] = useState('');
  const [loginError, setLoginError] = useState('');
  const [keyCopied, setKeyCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setUniversity, setDisplayName, setGender: setCtxGender, setUserId, setSecretKey, acceptTos } = useUniversity();
  const insets = useSafeAreaInsets();

  const filteredInstitutions = useMemo(() => {
    let filtered = INSTITUTIONS;
    if (selectedCountry) {
      filtered = filtered.filter(i => i.country === selectedCountry);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.fullName.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [search, selectedCountry]);

  const handleAcceptTos = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await acceptTos();
    setStep('mode');
  };

  const handleProfileNext = () => {
    if (!gender) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep('university');
  };

  const handleFinish = async () => {
    if (!selectedUni || !gender) return;
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const displayName = name.trim() || 'Anonymous';
    setIsLoading(true);
    try {
      const user = await registerUser(displayName, gender, selectedUni.id);
      await setUserId(user.id);
      if (user.secretKey) {
        await setSecretKey(user.secretKey);
        setGeneratedKey(user.secretKey);
      }
      await setDisplayName(displayName);
      await setCtxGender(gender);
      setStep('secretkey');
    } catch {
      await setDisplayName(displayName);
      await setCtxGender(gender);
      await setUniversity(selectedUni.id);
    }
    setIsLoading(false);
  };

  const handleCopyKey = async () => {
    await Clipboard.setStringAsync(generatedKey);
    setKeyCopied(true);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleEnterWall = async () => {
    if (!selectedUni) return;
    await setUniversity(selectedUni.id);
  };

  const handleLogin = async () => {
    if (!loginKey.trim()) {
      setLoginError('Please enter your secret key');
      return;
    }
    setIsLoading(true);
    setLoginError('');
    try {
      const user = await loginUser(loginKey.trim());
      await setUserId(user.id);
      await setSecretKey(loginKey.trim());
      await setDisplayName(user.displayName);
      await setCtxGender(user.gender as Gender);
      await setUniversity(user.university as any);
    } catch {
      setLoginError('Invalid secret key. There is no account recovery option.');
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setIsLoading(false);
  };

  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  if (step === 'tos') {
    return (
      <LinearGradient colors={['#0F172A', '#1a1040', '#0F172A']} style={styles.container}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.tosContent, { paddingTop: insets.top + webTopInset + 40, paddingBottom: insets.bottom + webBottomInset + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn.duration(500)} style={styles.heroSection}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="wall" size={48} color={Colors.dark.primary} />
            </View>
            <Text style={styles.title}>UniWall</Text>
            <Text style={styles.subtitle}>Anonymous Campus Social</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.tosBox}>
            <Text style={styles.tosTitle}>Terms & Conditions</Text>
            <View style={styles.tosItem}>
              <Ionicons name="information-circle" size={18} color={Colors.dark.accent} />
              <Text style={styles.tosText}>
                This is an <Text style={styles.tosBold}>unofficial</Text> app. UniWall is not affiliated with, endorsed by, or connected to any university, college, or educational institution.
              </Text>
            </View>
            <View style={styles.tosItem}>
              <Ionicons name="shield-checkmark" size={18} color={Colors.dark.accent} />
              <Text style={styles.tosText}>
                Your identity remains anonymous by default. You may optionally provide a display name.
              </Text>
            </View>
            <View style={styles.tosItem}>
              <Ionicons name="key" size={18} color={Colors.dark.heat} />
              <Text style={styles.tosText}>
                A <Text style={styles.tosBold}>secret key</Text> will be generated for your account. Save it - there is <Text style={styles.tosBold}>no account recovery</Text> option.
              </Text>
            </View>
            <View style={styles.tosItem}>
              <Ionicons name="lock-closed" size={18} color={Colors.dark.accent} />
              <Text style={styles.tosText}>
                Your data is stored securely. Chat messages are automatically deleted after 24 hours.
              </Text>
            </View>
            <View style={styles.tosItem}>
              <Ionicons name="warning" size={18} color={Colors.dark.heat} />
              <Text style={styles.tosText}>
                Offensive content, harassment, and hate speech are strictly prohibited. Posts violating community guidelines will be removed.
              </Text>
            </View>
            <View style={styles.tosItem}>
              <Ionicons name="camera" size={18} color={Colors.dark.accent} />
              <Text style={styles.tosText}>
                Only real-time camera captures are allowed. Gallery uploads are disabled to prevent misuse.
              </Text>
            </View>
            <View style={styles.tosItem}>
              <Ionicons name="people" size={18} color={Colors.dark.accent} />
              <Text style={styles.tosText}>
                UniWall is an inclusive platform. All genders and backgrounds are welcome.
              </Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(500)} style={{ width: '100%' }}>
            <Pressable onPress={handleAcceptTos} style={styles.primaryButton}>
              <LinearGradient
                colors={['#A855F7', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.primaryButtonText}>I Agree & Continue</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    );
  }

  if (step === 'mode') {
    return (
      <LinearGradient colors={['#0F172A', '#1a1040', '#0F172A']} style={styles.container}>
        <View style={[styles.stepContent, { paddingTop: insets.top + webTopInset + 20, paddingBottom: insets.bottom + webBottomInset + 20 }]}>
          <Pressable onPress={() => setStep('tos')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
          </Pressable>

          <Animated.View entering={FadeIn.duration(400)} style={styles.stepHeader}>
            <Text style={styles.stepTitle}>Welcome</Text>
            <Text style={styles.stepSubtitle}>Create a new account or login with your secret key</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.modeCards}>
            <Pressable onPress={() => setStep('profile')} style={styles.modeCard}>
              <LinearGradient colors={['rgba(168,85,247,0.15)', 'rgba(168,85,247,0.05)']} style={styles.modeCardGradient}>
                <View style={styles.modeIconWrap}>
                  <Ionicons name="person-add" size={28} color={Colors.dark.primary} />
                </View>
                <Text style={styles.modeCardTitle}>New Account</Text>
                <Text style={styles.modeCardDesc}>Create a fresh anonymous identity and get your secret key</Text>
              </LinearGradient>
            </Pressable>

            <Pressable onPress={() => setStep('login')} style={styles.modeCard}>
              <LinearGradient colors={['rgba(34,211,238,0.15)', 'rgba(34,211,238,0.05)']} style={styles.modeCardGradient}>
                <View style={[styles.modeIconWrap, { backgroundColor: Colors.dark.accentMuted }]}>
                  <Ionicons name="key" size={28} color={Colors.dark.accent} />
                </View>
                <Text style={[styles.modeCardTitle, { color: Colors.dark.accent }]}>Login</Text>
                <Text style={styles.modeCardDesc}>Use your secret key to access your existing account</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>
      </LinearGradient>
    );
  }

  if (step === 'login') {
    return (
      <LinearGradient colors={['#0F172A', '#1a1040', '#0F172A']} style={styles.container}>
        <View style={[styles.stepContent, { paddingTop: insets.top + webTopInset + 20, paddingBottom: insets.bottom + webBottomInset + 20 }]}>
          <Pressable onPress={() => setStep('mode')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
          </Pressable>

          <Animated.View entering={FadeIn.duration(400)} style={styles.stepHeader}>
            <Text style={styles.stepTitle}>Login</Text>
            <Text style={styles.stepSubtitle}>Enter the secret key you received when you created your account</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Secret Key</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="key" size={20} color={Colors.dark.textMuted} />
                <TextInput
                  style={[styles.textInput, { fontFamily: 'Outfit_600SemiBold', letterSpacing: 2 }]}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  placeholderTextColor={Colors.dark.textMuted}
                  value={loginKey}
                  onChangeText={(t) => { setLoginKey(t.toUpperCase()); setLoginError(''); }}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              </View>
            </View>

            {!!loginError && (
              <View style={styles.errorBox}>
                <Ionicons name="warning" size={16} color={Colors.dark.danger} />
                <Text style={styles.errorText}>{loginError}</Text>
              </View>
            )}

            <View style={styles.warningBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.dark.heat} />
              <Text style={styles.warningText}>There is no account recovery option. If you lost your key, you cannot access your old account.</Text>
            </View>
          </Animated.View>

          <View style={{ width: '100%', marginTop: 'auto' }}>
            <Pressable
              onPress={handleLogin}
              disabled={isLoading || !loginKey.trim()}
              style={[styles.primaryButton, (!loginKey.trim() || isLoading) && { opacity: 0.5 }]}
            >
              <LinearGradient
                colors={loginKey.trim() ? ['#22D3EE', '#0891B2'] : ['#334155', '#334155']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Ionicons name="log-in" size={20} color={loginKey.trim() ? '#fff' : Colors.dark.textMuted} />
                <Text style={[styles.primaryButtonText, !loginKey.trim() && { color: Colors.dark.textMuted }]}>
                  {isLoading ? 'Logging in...' : 'Login'}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    );
  }

  if (step === 'secretkey') {
    return (
      <LinearGradient colors={['#0F172A', '#1a1040', '#0F172A']} style={styles.container}>
        <View style={[styles.stepContent, { paddingTop: insets.top + webTopInset + 20, paddingBottom: insets.bottom + webBottomInset + 20 }]}>
          <Animated.View entering={FadeIn.duration(400)} style={styles.stepHeader}>
            <Text style={styles.stepTitle}>Your Secret Key</Text>
            <Text style={styles.stepSubtitle}>Save this key somewhere safe. You'll need it to login again.</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.keySection}>
            <View style={styles.keyBox}>
              <Ionicons name="key" size={32} color={Colors.dark.primary} />
              <Text style={styles.keyText}>{generatedKey}</Text>
              <Pressable onPress={handleCopyKey} style={styles.copyBtn}>
                <Ionicons name={keyCopied ? "checkmark-circle" : "copy"} size={20} color={keyCopied ? Colors.dark.success : Colors.dark.primary} />
                <Text style={[styles.copyBtnText, keyCopied && { color: Colors.dark.success }]}>
                  {keyCopied ? 'Copied!' : 'Copy Key'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.warningBox}>
              <Ionicons name="alert-circle" size={18} color={Colors.dark.danger} />
              <Text style={[styles.warningText, { color: Colors.dark.danger }]}>
                There is NO account recovery option. If you lose this key, you will lose access to your account permanently.
              </Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={{ width: '100%', marginTop: 'auto' }}>
            <Pressable onPress={handleEnterWall} style={styles.primaryButton}>
              <LinearGradient
                colors={['#A855F7', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <MaterialCommunityIcons name="wall" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>Enter the Wall</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>
      </LinearGradient>
    );
  }

  if (step === 'profile') {
    return (
      <LinearGradient colors={['#0F172A', '#1a1040', '#0F172A']} style={styles.container}>
        <View style={[styles.stepContent, { paddingTop: insets.top + webTopInset + 20, paddingBottom: insets.bottom + webBottomInset + 20 }]}>
          <Pressable onPress={() => setStep('mode')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
          </Pressable>

          <Animated.View entering={FadeIn.duration(400)} style={styles.stepHeader}>
            <Text style={styles.stepTitle}>About You</Text>
            <Text style={styles.stepSubtitle}>Optional - you can stay anonymous</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Display Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color={Colors.dark.textMuted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Anonymous (leave empty to stay anon)"
                  placeholderTextColor={Colors.dark.textMuted}
                  value={name}
                  onChangeText={setName}
                  maxLength={30}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Gender</Text>
              <View style={styles.genderRow}>
                {([
                  { id: 'male' as Gender, icon: 'male' as const, label: 'Male' },
                  { id: 'female' as Gender, icon: 'female' as const, label: 'Female' },
                  { id: 'other' as Gender, icon: 'transgender' as const, label: 'Other' },
                ]).map(g => (
                  <Pressable
                    key={g.id}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.selectionAsync();
                      setGender(g.id);
                    }}
                    style={[styles.genderCard, gender === g.id && styles.genderCardActive]}
                  >
                    <Ionicons
                      name={g.icon}
                      size={24}
                      color={gender === g.id ? Colors.dark.primary : Colors.dark.textMuted}
                    />
                    <Text style={[styles.genderLabel, gender === g.id && styles.genderLabelActive]}>
                      {g.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={{ width: '100%', marginTop: 'auto' }}>
            <Pressable
              onPress={handleProfileNext}
              disabled={!gender}
              style={[styles.primaryButton, !gender && { opacity: 0.5 }]}
            >
              <LinearGradient
                colors={gender ? ['#A855F7', '#7C3AED'] : ['#334155', '#334155']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={[styles.primaryButtonText, !gender && { color: Colors.dark.textMuted }]}>
                  Next
                </Text>
                <Ionicons name="arrow-forward" size={20} color={gender ? '#fff' : Colors.dark.textMuted} />
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0F172A', '#1a1040', '#0F172A']} style={styles.container}>
      <View style={[styles.stepContent, { paddingTop: insets.top + webTopInset + 20, paddingBottom: insets.bottom + webBottomInset + 20 }]}>
        <Pressable onPress={() => setStep('profile')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
        </Pressable>

        <Animated.View entering={FadeIn.duration(400)} style={styles.stepHeader}>
          <Text style={styles.stepTitle}>Your Campus</Text>
          <Text style={styles.stepSubtitle}>Pick your university, college, or school</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={{ flex: 1 }}>
          <View style={styles.inputWrapper}>
            <Ionicons name="search" size={20} color={Colors.dark.textMuted} />
            <TextInput
              style={styles.textInput}
              placeholder="Search institutions..."
              placeholderTextColor={Colors.dark.textMuted}
              value={search}
              onChangeText={setSearch}
            />
            {!!search && (
              <Pressable onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={20} color={Colors.dark.textMuted} />
              </Pressable>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.countryScroll} contentContainerStyle={styles.countryScrollContent}>
            <Pressable
              onPress={() => setSelectedCountry(null)}
              style={[styles.countryChip, !selectedCountry && styles.countryChipActive]}
            >
              <Text style={[styles.countryChipText, !selectedCountry && styles.countryChipTextActive]}>All</Text>
            </Pressable>
            {COUNTRIES.map(c => (
              <Pressable
                key={c}
                onPress={() => setSelectedCountry(c === selectedCountry ? null : c)}
                style={[styles.countryChip, selectedCountry === c && styles.countryChipActive]}
              >
                <Text style={[styles.countryChipText, selectedCountry === c && styles.countryChipTextActive]}>{c}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <FlatList
            data={filteredInstitutions}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.selectionAsync();
                  setSelectedUni(item);
                }}
                style={[styles.uniCard, selectedUni?.id === item.id && styles.uniCardActive]}
              >
                <View style={styles.uniCardLeft}>
                  <View style={[styles.uniTypeBadge, { backgroundColor: item.type === 'university' ? Colors.dark.primaryMuted : Colors.dark.accentMuted }]}>
                    <Ionicons
                      name={item.type === 'university' ? 'school' : 'business'}
                      size={14}
                      color={item.type === 'university' ? Colors.dark.primary : Colors.dark.accent}
                    />
                  </View>
                  <View style={styles.uniTextContainer}>
                    <Text style={[styles.uniName, selectedUni?.id === item.id && styles.uniNameActive]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.uniFullName} numberOfLines={1}>{item.fullName}</Text>
                    <Text style={styles.uniCountry}>{item.country}</Text>
                  </View>
                </View>
                {selectedUni?.id === item.id && (
                  <Ionicons name="checkmark-circle" size={22} color={Colors.dark.primary} />
                )}
              </Pressable>
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.uniList}
            scrollEnabled={filteredInstitutions.length > 0}
            ListEmptyComponent={
              <View style={styles.emptyList}>
                <Ionicons name="search" size={32} color={Colors.dark.textMuted} />
                <Text style={styles.emptyListText}>No institutions found</Text>
              </View>
            }
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={{ width: '100%', paddingTop: 12 }}>
          <Pressable
            onPress={handleFinish}
            disabled={!selectedUni || isLoading}
            style={[styles.primaryButton, (!selectedUni || isLoading) && { opacity: 0.5 }]}
          >
            <LinearGradient
              colors={selectedUni ? ['#A855F7', '#7C3AED'] : ['#334155', '#334155']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <MaterialCommunityIcons name="wall" size={20} color={selectedUni ? '#fff' : Colors.dark.textMuted} />
              <Text style={[styles.primaryButtonText, !selectedUni && { color: Colors.dark.textMuted }]}>
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tosContent: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.dark.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontFamily: 'Outfit_800ExtraBold',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: Colors.dark.textSecondary,
  },
  tosBox: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 14,
  },
  tosTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  tosItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  tosText: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: Colors.dark.textSecondary,
    flex: 1,
    lineHeight: 19,
  },
  tosBold: {
    fontFamily: 'Outfit_600SemiBold',
    color: Colors.dark.text,
  },
  primaryButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 17,
    fontFamily: 'Outfit_700Bold',
    color: '#fff',
  },
  stepHeader: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 28,
    fontFamily: 'Outfit_800ExtraBold',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    color: Colors.dark.textSecondary,
  },
  formSection: {
    gap: 24,
  },
  inputGroup: {
    gap: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: Colors.dark.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 10,
  },
  textInput: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderCard: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.dark.border,
  },
  genderCardActive: {
    borderColor: Colors.dark.primary,
    backgroundColor: Colors.dark.primaryMuted,
  },
  genderLabel: {
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
    color: Colors.dark.textMuted,
  },
  genderLabelActive: {
    color: Colors.dark.primary,
  },
  countryScroll: {
    maxHeight: 44,
    marginTop: 12,
    marginBottom: 12,
  },
  countryScrollContent: {
    gap: 8,
    paddingRight: 8,
  },
  countryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  countryChipActive: {
    backgroundColor: Colors.dark.primaryMuted,
    borderColor: Colors.dark.primary,
  },
  countryChipText: {
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
    color: Colors.dark.textSecondary,
  },
  countryChipTextActive: {
    color: Colors.dark.primary,
  },
  uniList: {
    gap: 8,
    paddingBottom: 8,
  },
  uniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.dark.border,
  },
  uniCardActive: {
    borderColor: Colors.dark.primary,
    backgroundColor: 'rgba(168, 85, 247, 0.06)',
  },
  uniCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  uniTypeBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uniTextContainer: {
    flex: 1,
  },
  uniName: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
    color: Colors.dark.text,
  },
  uniNameActive: {
    color: Colors.dark.primary,
  },
  uniFullName: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: Colors.dark.textMuted,
    marginTop: 1,
  },
  uniCountry: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  emptyList: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    gap: 8,
  },
  emptyListText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: Colors.dark.textMuted,
  },
  modeCards: {
    gap: 16,
    flex: 1,
    justifyContent: 'center',
  },
  modeCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  modeCardGradient: {
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  modeIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.dark.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeCardTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    color: Colors.dark.primary,
  },
  modeCardDesc: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  keySection: {
    gap: 20,
    flex: 1,
    justifyContent: 'center',
  },
  keyBox: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  keyText: {
    fontSize: 22,
    fontFamily: 'Outfit_800ExtraBold',
    color: Colors.dark.primary,
    letterSpacing: 3,
    textAlign: 'center',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.dark.primaryMuted,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  copyBtnText: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: Colors.dark.primary,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  warningText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: Colors.dark.heat,
    flex: 1,
    lineHeight: 17,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.dark.dangerMuted,
    padding: 14,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
    color: Colors.dark.danger,
    flex: 1,
  },
});
