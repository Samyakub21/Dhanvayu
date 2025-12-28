/* eslint-disable @typescript-eslint/no-unused-vars */
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential, signOut, updateProfile } from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import {
  Bell,
  Check, ChevronDown,
  ChevronRight,
  DollarSign,
  FileText,
  LogOut,
  Megaphone,
  Save, Shield,
  Trash2,
  User
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../../firebaseConfig';
// IMPORT THE HOOK
import { useUser } from '../../context/UserContext';

const THEME = {
  bg: '#09090b',
  card: '#18181b',
  text: '#fafafa',
  subText: '#a1a1aa',
  primary: '#8b5cf6',
  danger: '#ef4444',
  border: '#3f3f46',
};

const CURRENCIES = [
  { code: 'INR', label: 'Indian Rupee', symbol: '₹' },
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'GBP', label: 'British Pound', symbol: '£' },
  { code: 'JPY', label: 'Japanese Yen', symbol: '¥' },
];

export default function ProfileScreen() {
  const user = auth.currentUser;
  const router = useRouter();
  
  // USE GLOBAL CONTEXT
  const { currency, setCurrency } = useUser();

  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [notifications, setNotifications] = useState(true);
  
  // Dropdown State
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

  // Load ONLY non-global settings locally (like notifications)
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid, 'settings', 'preferences'), (snap) => {
      if (snap.exists()) {
        setNotifications(snap.data().notificationsEnabled ?? true);
      }
    });
    return unsub;
  }, [user]);

  const updateSetting = async (field: string, value: any) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'settings', 'preferences'), { [field]: value }).catch(() => {});
  };

  const handleOpenLink = async (url: string) => {
    try { await WebBrowser.openBrowserAsync(url); } catch (e) { Alert.alert("Error", "Could not open link"); }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateProfile(user, { displayName });
      Alert.alert("Success", "Profile updated!");
    } catch (e) { Alert.alert("Error", (e as Error).message); }
    setLoading(false);
  };

  const handleLogout = async () => { await signOut(auth); };
  
  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account?",
      "This is permanent. All your data will be wiped.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete Forever", 
          style: "destructive", 
          onPress: async () => {
            setLoading(true);
            try {
              // If you want to proactively ask Cloud Functions to clean up first, you can call a callable function here.
              // Otherwise, the onDelete trigger will run after deleteUser() completes.
              await deleteUser(user!);
              // signOut/navigation handled by auth listener on change
            } catch (e: any) {
              // Re-auth required
              if (e.code === 'auth/requires-recent-login') {
                Alert.alert('Security Check', 'Please re-login to delete your account. You can sign out and login again, then retry deletion.');
                // Optional: show a reauth modal to capture credentials (see reauthenticateWithCredential example below).
              } else {
                Alert.alert("Error", e.message || 'Failed to delete account');
              }
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Example reauth helper (if you collect password in a modal)
  const reauthAndDelete = async (password: string) => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      await deleteUser(user);
    } catch (err: any) {
      Alert.alert('Re-auth failed', err.message || 'Unable to re-authenticate');
    } finally {
      setLoading(false);
    }
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
               {/* ID removed for privacy */}
            </View>
          </View>
          
          <View style={styles.inputRow}>
            <User size={20} color={THEME.subText} />
            <TextInput 
              style={styles.input} value={displayName} onChangeText={setDisplayName} 
              placeholder="Display Name" placeholderTextColor="#52525b"
            />
            <TouchableOpacity onPress={handleUpdateProfile} disabled={loading}>
              <Save size={20} color={THEME.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* AD BANNER */}
        <TouchableOpacity
          style={styles.adBanner}
          onPress={() => handleOpenLink('https://your-ad-link.example.com')}
          activeOpacity={0.85}
        >
          <View style={{flexDirection:'row', alignItems:'center', gap:10}}>
            <Megaphone size={20} color="#fbbf24" />
            <View>
              <Text style={{color:'white', fontWeight:'bold'}}>Upgrade to Pro</Text>
              <Text style={{color:'#a1a1aa', fontSize:11}}>Remove ads & unlock themes</Text>
            </View>
          </View>
          <ChevronRight size={16} color="#71717a" />
        </TouchableOpacity>

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

          {/* CURRENCY DROPDOWN TRIGGER */}
          <TouchableOpacity style={styles.settingRow} onPress={() => setShowCurrencyModal(true)}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
                <DollarSign size={20} color="#22c55e" />
              </View>
              <Text style={styles.settingLabel}>Currency</Text>
            </View>
            
            <View style={styles.dropdownTrigger}>
              <Text style={styles.dropdownText}>{currency}</Text>
              <ChevronDown size={16} color={THEME.subText} />
            </View>
          </TouchableOpacity>
        </View>

        {/* LEGAL SECTION */}
        <Text style={styles.sectionTitle}>Legal & About</Text>
        <View style={styles.card}>
          
          {/* Privacy Policy */}
          <TouchableOpacity 
            style={styles.settingRow} 
            onPress={() => handleOpenLink('https://sites.google.com/view/dhanvayu/privacy-policy')}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}> 
                <Shield size={20} color="#3b82f6" />
              </View>
              <Text style={styles.settingLabel}>Privacy Policy</Text>
            </View>
            <ChevronRight size={16} color={THEME.subText} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Terms of Service */}
          <TouchableOpacity 
            style={styles.settingRow} 
            onPress={() => handleOpenLink('https://sites.google.com/view/dhanvayu/terms-of-service')}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                <FileText size={20} color="#a855f7" />
              </View>
              <Text style={styles.settingLabel}>Terms of Service</Text>
            </View>
            <ChevronRight size={16} color={THEME.subText} />
          </TouchableOpacity>
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

        <Text style={styles.version}>Version 1.0.3 (Build 46)</Text>
      </ScrollView>

      {/* CURRENCY SELECTION MODAL */}
      <Modal visible={showCurrencyModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Currency</Text>
              <TouchableOpacity onPress={() => setShowCurrencyModal(false)}>
                <Text style={{color: THEME.subText}}>Close</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={CURRENCIES}
              keyExtractor={(item) => item.code}
              renderItem={({item}) => (
                <TouchableOpacity 
                  style={[styles.currencyOption, currency === item.code && styles.currencyOptionActive]}
                  onPress={() => {
                    setCurrency(item.code as any);
                    setShowCurrencyModal(false);
                  }}
                >
                  <View style={{flexDirection:'row', gap: 10, alignItems:'center'}}>
                    <View style={styles.currencyIcon}>
                      <Text style={{color: 'white', fontWeight:'bold'}}>{item.symbol}</Text>
                    </View>
                    <View>
                      <Text style={styles.optionCode}>{item.code}</Text>
                      <Text style={styles.optionLabel}>{item.label}</Text>
                    </View>
                  </View>
                  {currency === item.code && <Check size={20} color={THEME.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

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
  //uidText: { color: THEME.subText, fontSize: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#09090b', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: THEME.border, gap: 10 },
  input: { flex: 1, color: 'white', fontSize: 16 },
  sectionTitle: { color: THEME.subText, fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 10, paddingLeft: 5 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { color: 'white', fontSize: 16, fontWeight: '500' },
  divider: { height: 1, backgroundColor: THEME.border, marginVertical: 12 },
  
  // Dropdown Styles
  dropdownTrigger: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#27272a', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  dropdownText: { color: 'white', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: THEME.card, borderRadius: 24, padding: 20, maxHeight: '60%', borderWidth: 1, borderColor: THEME.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
  modalTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  currencyOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#27272a' },
  currencyOptionActive: { backgroundColor: 'rgba(139, 92, 246, 0.1)', marginHorizontal: -10, paddingHorizontal: 10, borderRadius: 12, borderBottomColor: 'transparent' },
  currencyIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#27272a', alignItems: 'center', justifyContent: 'center' },
  optionCode: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  optionLabel: { color: THEME.subText, fontSize: 12 },
  
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10, padding: 16, borderRadius: 16, backgroundColor: '#27272a' },
  logoutText: { color: 'white', fontWeight: 'bold' },
  version: { textAlign: 'center', color: '#52525b', marginTop: 30, fontSize: 12 },
  loaderOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  adBanner: {
    backgroundColor: '#27272a',
    padding: 15,
    borderRadius: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});