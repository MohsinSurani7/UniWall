import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UniversityId, Gender } from '@/constants/universities';

const UNI_KEY = '@uniwall_university';
const NAME_KEY = '@uniwall_display_name';
const GENDER_KEY = '@uniwall_gender';
const USER_ID_KEY = '@uniwall_user_id';
const TOS_KEY = '@uniwall_tos_accepted';
const SECRET_KEY = '@uniwall_secret_key';

interface UniversityContextValue {
  university: UniversityId | null;
  displayName: string;
  gender: Gender | null;
  userId: string | null;
  secretKey: string | null;
  tosAccepted: boolean;
  isLoading: boolean;
  setUniversity: (id: UniversityId) => Promise<void>;
  setDisplayName: (name: string) => Promise<void>;
  setGender: (g: Gender) => Promise<void>;
  setUserId: (id: string) => Promise<void>;
  setSecretKey: (key: string) => Promise<void>;
  acceptTos: () => Promise<void>;
  clearAll: () => Promise<void>;
}

const UniversityContext = createContext<UniversityContextValue | null>(null);

export function UniversityProvider({ children }: { children: ReactNode }) {
  const [university, setUni] = useState<UniversityId | null>(null);
  const [displayName, setName] = useState('Anonymous');
  const [gender, setGen] = useState<Gender | null>(null);
  const [userId, setUid] = useState<string | null>(null);
  const [secretKey, setSk] = useState<string | null>(null);
  const [tosAccepted, setTos] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(UNI_KEY),
      AsyncStorage.getItem(NAME_KEY),
      AsyncStorage.getItem(GENDER_KEY),
      AsyncStorage.getItem(USER_ID_KEY),
      AsyncStorage.getItem(TOS_KEY),
      AsyncStorage.getItem(SECRET_KEY),
    ]).then(([uni, name, gen, uid, tos, sk]) => {
      if (uni) setUni(uni as UniversityId);
      if (name) setName(name);
      if (gen) setGen(gen as Gender);
      if (uid) setUid(uid);
      if (tos === 'true') setTos(true);
      if (sk) setSk(sk);
      setIsLoading(false);
    });
  }, []);

  const setUniversity = async (id: UniversityId) => {
    await AsyncStorage.setItem(UNI_KEY, id);
    setUni(id);
  };

  const setDisplayName = async (name: string) => {
    const n = name.trim() || 'Anonymous';
    await AsyncStorage.setItem(NAME_KEY, n);
    setName(n);
  };

  const setGender = async (g: Gender) => {
    await AsyncStorage.setItem(GENDER_KEY, g);
    setGen(g);
  };

  const setUserIdFn = async (id: string) => {
    await AsyncStorage.setItem(USER_ID_KEY, id);
    setUid(id);
  };

  const setSecretKeyFn = async (key: string) => {
    await AsyncStorage.setItem(SECRET_KEY, key);
    setSk(key);
  };

  const acceptTos = async () => {
    await AsyncStorage.setItem(TOS_KEY, 'true');
    setTos(true);
  };

  const clearAll = async () => {
    await Promise.all([
      AsyncStorage.removeItem(UNI_KEY),
      AsyncStorage.removeItem(NAME_KEY),
      AsyncStorage.removeItem(GENDER_KEY),
      AsyncStorage.removeItem(USER_ID_KEY),
      AsyncStorage.removeItem(TOS_KEY),
      AsyncStorage.removeItem(SECRET_KEY),
    ]);
    setUni(null);
    setName('Anonymous');
    setGen(null);
    setUid(null);
    setSk(null);
    setTos(false);
  };

  const value = useMemo(() => ({
    university,
    displayName,
    gender,
    userId,
    secretKey,
    tosAccepted,
    isLoading,
    setUniversity,
    setDisplayName,
    setGender,
    setUserId: setUserIdFn,
    setSecretKey: setSecretKeyFn,
    acceptTos,
    clearAll,
  }), [university, displayName, gender, userId, secretKey, tosAccepted, isLoading]);

  return (
    <UniversityContext.Provider value={value}>
      {children}
    </UniversityContext.Provider>
  );
}

export function useUniversity() {
  const context = useContext(UniversityContext);
  if (!context) {
    throw new Error('useUniversity must be used within UniversityProvider');
  }
  return context;
}
