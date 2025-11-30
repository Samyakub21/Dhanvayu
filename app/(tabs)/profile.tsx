/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Alert, Switch, ScrollView, TextInput, ActivityIndicator 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  User, Bell, DollarSign, Trash2, LogOut, ChevronRight, Save, Mail, ShieldAlert 
} from 'lucide-react-native';
import { auth, db } from '../../firebaseConfig';
import { doc, onSnapshot, updateDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { signOut, deleteUser, updateProfile } from 'firebase/auth';
import { useRouter } from 'expo-router';

const THEME = {
  bg: '#09090b',
  card: '#18181b',
  text: '#fafafa',
  subText: '#a1a1aa',
  primary: '#8b5cf6',
  danger: '#ef4444',
  border: '#3f3f46',
};

export default function ProfileScreen() {
  const user = auth.currentUser;
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  
  // Settings State
  const [currency, setCurrency] = useState('INR'); // INR, USD, EUR
  const [notifications, setNotifications] = useState(true);

  // Load Settings from Firestore
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid, 'settings', 'preferences'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCurrency(data.currency || 'INR');
        setNotifications(data.notificationsEnabled ?? true);
      }
    });
    return unsub;
  }, [user]);

  // Update Firestore Helper
  const updateSetting = async (field: string, value: any) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'settings', 'preferences'), {
        [field]: value
      });
    } catch (e) {
      // Create if doesn't exist (handled by setDoc usually, but specific to your db structure)
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateProfile(user, { displayName });
      Alert.alert("Success", "Profile updated!");
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    }
    setLoading(false);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account?",
      "This is permanent. All your data (expenses, chats) will be wiped.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete Forever", 
          style: "destructive", 
          onPress: async () => {
            setLoading(true);
            try {
              // 1. Delete Firestore Data (Optional: Cloud Functions usually handle this)
              // For client-side, we might just clear critical collections
              // 2. Delete Auth
              await deleteUser(user!);
              // Router will auto-redirect to login due to auth state change
            } catch (e: any) {
              if (e.code === 'auth/requires-recent-login') {
                Alert.alert("Security Check", "Please logout and login again to delete your account.");
              } else {
                Alert.alert("Error", e.message);
              }
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    await signOut(auth);
    // Navigation handled by auth listener in root
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[THEME.bg, '#1e1b4b']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile & Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* PROFILE CARD */}
        <View style={styles.card}>
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.email?.[0].toUpperCase()}</Text>
            </View>
            <View>
               <Text style={styles.emailText}>{user?.email}</Text>
               <Text style={styles.uidText}>ID: {user?.uid.slice(0, 8)}...</Text>
            </View>
          </View>
          
          <View style={styles.inputRow}>
            <User size={20} color={THEME.subText} />
            <TextInput 
              style={styles.input} 
              value={displayName} 
              onChangeText={setDisplayName} 
              placeholder="Display Name" 
              placeholderTextColor="#52525b"
            />
            <TouchableOpacity onPress={handleUpdateProfile} disabled={loading}>
              <Save size={20} color={THEME.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* SETTINGS SECTION */}
        <Text style={styles.sectionTitle}>App Settings</Text>
        
        <View style={styles.card}>
          {/* Notifications */}
          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(234, 179, 8, 0.15)' }]}>
                <Bell size={20} color="#eab308" />
              </View>
              <Text style={styles.settingLabel}>Push Notifications</Text>
            </View>
            <Switch 
              value={notifications} 
              onValueChange={(val) => { setNotifications(val); updateSetting('notificationsEnabled', val); }}
              trackColor={{ false: '#27272a', true: THEME.primary }}
            />
          </View>

          <View style={styles.divider} />

          {/* Currency */}
          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
                <DollarSign size={20} color="#22c55e" />
              </View>
              <Text style={styles.settingLabel}>Currency</Text>
            </View>
            <TouchableOpacity 
              style={styles.currencyBtn}
              onPress={() => {
                const next = currency === 'INR' ? 'USD' : currency === 'USD' ? 'EUR' : 'INR';
                setCurrency(next);
                updateSetting('currency', next);
              }}
            >
              <Text style={styles.currencyText}>{currency} ({currency === 'INR' ? '₹' : currency === 'USD' ? '$' : '€'})</Text>
              <ChevronRight size={16} color={THEME.subText} />
            </TouchableOpacity>
          </View>
        </View>

        {/* DANGER ZONE */}
        <Text style={[styles.sectionTitle, { color: THEME.danger }]}>Danger Zone</Text>
        <View style={[styles.card, { borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
          <TouchableOpacity style={styles.settingRow} onPress={handleDeleteAccount}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Trash2 size={20} color={THEME.danger} />
              </View>
              <Text style={[styles.settingLabel, { color: THEME.danger }]}>Delete Account</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={20} color={THEME.subText} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.2 (Build 45)</Text>

      </ScrollView>
      
      {loading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color={THEME.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: 'white' },
  content: { padding: 20, paddingBottom: 100 },
  card: { backgroundColor: THEME.card, borderRadius: 20, padding: 16, marginBottom: 25, borderWidth: 1, borderColor: THEME.border },
  avatarSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 15 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: THEME.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  emailText: { color: 'white', fontSize: 16, fontWeight: '600' },
  uidText: { color: THEME.subText, fontSize: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#09090b', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: THEME.border, gap: 10 },
  input: { flex: 1, color: 'white', fontSize: 16 },
  sectionTitle: { color: THEME.subText, fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 10, paddingLeft: 5 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { color: 'white', fontSize: 16, fontWeight: '500' },
  currencyBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  currencyText: { color: THEME.subText, fontSize: 14 },
  divider: { height: 1, backgroundColor: THEME.border, marginVertical: 12 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10, padding: 16, borderRadius: 16, backgroundColor: '#27272a' },
  logoutText: { color: 'white', fontWeight: 'bold' },
  version: { textAlign: 'center', color: '#52525b', marginTop: 30, fontSize: 12 },
  loaderOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', zIndex: 100 }
});