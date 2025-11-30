import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, ActivityIndicator, AppState, StyleSheet, 
  TouchableOpacity, TextInput, Alert, Vibration, StatusBar 
} from 'react-native';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, Fingerprint, Sparkles, Delete } from 'lucide-react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { 
  GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Adjust path if needed

// --- CONSTANTS ---
const THEME = {
  bg: '#09090b',
  primary: '#8b5cf6',
  accent: '#d946ef',
  danger: '#ef4444',
};

// --- AUTH SCREEN COMPONENT ---
const AuthScreen = ({ onLogin }: { onLogin: any }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    redirectUri: makeRedirectUri({ scheme: 'dhanvayu' }), 
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      setLoading(true);
      signInWithCredential(auth, credential).catch((e) => {
        Alert.alert("Login Failed", e.message);
        setLoading(false);
      });
    }
  }, [response]);

  const handleAuth = async () => {
    if(!email || !password) return Alert.alert("Missing Info", "Fill in all fields.");
    setLoading(true);
    try {
      if (isLogin) await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (e) { Alert.alert("Error", (e as Error).message); setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#2e1065', '#09090b']} style={StyleSheet.absoluteFill} />
      <View style={styles.authContent}>
        <View style={styles.glassCard}>
          <View style={styles.logoGlow}><Sparkles size={32} color={THEME.accent} fill={THEME.accent} /></View>
          <Text style={styles.authTitle}>{isLogin ? "Welcome Back" : "Join the Squad"}</Text>
          
          <TouchableOpacity style={styles.googleBtn} disabled={!request} onPress={() => promptAsync()}>
            <Text style={styles.googleBtnText}>G  Continue with Google</Text>
          </TouchableOpacity>

          <Text style={{textAlign:'center', color:'#52525b', marginVertical:10}}>OR</Text>
          
          <TextInput 
            style={styles.input} placeholder="Email" placeholderTextColor="#52525b"
            value={email} onChangeText={setEmail} autoCapitalize="none"
          />
          <TextInput 
            style={styles.input} placeholder="Password" placeholderTextColor="#52525b"
            value={password} onChangeText={setPassword} secureTextEntry 
          />
          
          <TouchableOpacity onPress={handleAuth} disabled={loading}>
            <LinearGradient colors={['#d946ef', '#8b5cf6']} style={styles.mainBtn}>
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>{isLogin ? "Let's Go" : "Sign Up"}</Text>}
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={{marginTop: 20}}>
            <Text style={{color: THEME.accent, textAlign: 'center'}}>{isLogin ? "Create Account" : "Login instead"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// --- LOCK SCREEN COMPONENT ---
const LockScreen = ({ onUnlock }: { onUnlock: () => void }) => {
  const [pin, setPin] = useState('');
  
  useEffect(() => { checkBiometrics(); }, []);

  const checkBiometrics = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (hasHardware) {
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock DhanVayu' });
      if (result.success) onUnlock();
    }
  };

  const handlePress = (val: string) => {
    if (val === 'del') { setPin(p => p.slice(0, -1)); return; }
    const newPin = pin + val;
    setPin(newPin);
    if (newPin.length === 4) {
      if (newPin === '1234') onUnlock();
      else { Vibration.vibrate(); setPin(''); Alert.alert("Wrong PIN"); }
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#09090b', '#2e1065']} style={StyleSheet.absoluteFill} />
      <Lock size={40} color={THEME.accent} style={{marginBottom: 20}} />
      <Text style={styles.authTitle}>Locked</Text>
      
      <View style={{flexDirection:'row', gap:15, marginBottom:40, height: 20}}>
        {[0,1,2,3].map(i => <View key={i} style={[styles.dot, pin.length > i && {backgroundColor: THEME.accent}]} />)}
      </View>

      <View style={styles.keypad}>
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <TouchableOpacity key={n} onPress={() => handlePress(n.toString())} style={styles.key}>
            <Text style={styles.keyText}>{n}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity onPress={checkBiometrics} style={styles.key}><Fingerprint size={28} color={THEME.primary} /></TouchableOpacity>
        <TouchableOpacity onPress={() => handlePress('0')} style={styles.key}><Text style={styles.keyText}>0</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => handlePress('del')} style={styles.key}><Delete size={24} color={THEME.danger} /></TouchableOpacity>
      </View>
    </View>
  );
};

// --- ROOT LAYOUT (The Guard) ---
export default function RootLayout() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(true);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if(!u) setIsLocked(false);
    });

    const sub = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/active/) && nextAppState === 'background') {
        if (auth.currentUser) setIsLocked(true);
      }
      appState.current = nextAppState;
    });

    return () => { unsub(); sub.remove(); };
  }, []);

  if (loading) return <View style={styles.container}><ActivityIndicator size="large" color={THEME.accent} /></View>;
  if (!user) return <AuthScreen onLogin={setUser} />;
  if (isLocked) return <LockScreen onUnlock={() => setIsLocked(false)} />;

  return (
    <>
      <StatusBar barStyle="light-content" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black', alignItems: 'center', justifyContent: 'center' },
  authContent: { width: '100%', padding: 20 },
  glassCard: { backgroundColor: 'rgba(24,24,27,0.8)', padding: 30, borderRadius: 30, borderWidth: 1, borderColor: '#3f3f46' },
  logoGlow: { alignSelf: 'center', backgroundColor: 'rgba(217,70,239,0.1)', padding: 20, borderRadius: 50, marginBottom: 20 },
  authTitle: { fontSize: 28, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 20 },
  googleBtn: { backgroundColor: 'white', padding: 16, borderRadius: 16, alignItems: 'center' },
  googleBtnText: { fontWeight: 'bold', color: 'black' },
  input: { backgroundColor: '#27272a', borderRadius: 16, marginBottom: 16, padding: 18, color: 'white' },
  mainBtn: { padding: 18, borderRadius: 16, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold' },
  dot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#27272a', borderWidth: 1, borderColor: '#3f3f46' },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', width: 280, gap: 20, justifyContent: 'center' },
  key: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#18181b', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#27272a' },
  keyText: { fontSize: 24, color: 'white', fontWeight: 'bold' },
});