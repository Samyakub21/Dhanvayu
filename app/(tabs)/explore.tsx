/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as Contacts from 'expo-contacts';
import { LinearGradient } from 'expo-linear-gradient';
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp, updateDoc
} from 'firebase/firestore';
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  Divide,
  DollarSign,
  Megaphone,
  PieChart,
  Plus,
  Receipt,
  Send,
  UserPlus,
  Users,
  X
} from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList, KeyboardAvoidingView,
  Linking // <--- ADDED LINKING
  ,


  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { sendLocalNotification } from '../../services/notifications';

// --- THEME ---
const THEME = {
  bg: '#09090b',
  card: '#18181b',
  text: '#fafafa',
  subText: '#a1a1aa',
  primary: '#8b5cf6',
  accent: '#d946ef',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  input: '#27272a',
  border: '#3f3f46',
};

// --- TYPES ---
type ChatEntity = {
  id: string;
  type: 'friend' | 'group';
  name: string;
  phone?: string;
  members: string[]; 
  avatarColor: string;
  balance: number; 
  lastActive: any;
};

type FeedItem = {
  sender: string;
  id: string;
  type: 'expense' | 'message' | 'settlement';
  text?: string;
  amount?: number;
  description?: string;
  paidBy?: string; 
  splitType?: 'equal' | 'exact' | 'percent';
  splitDetails?: string; 
  splits?: Record<string, number>;
  balanceImpact?: number;
  createdAt: any;
};

// ... (Main Screen and SplitChatScreen logic remains the same) ...
// Keeping the imports and setup, let's fast forward to the Modals where the changes are.

export default function SplitChatScreen() {
  const [user, setUser] = useState(auth.currentUser);
  const [view, setView] = useState<'list' | 'chat'>('list');
  const [activeChat, setActiveChat] = useState<ChatEntity | null>(null);
  const [chats, setChats] = useState<ChatEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  const [currencySymbol, setCurrencySymbol] = useState('₹');
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid, 'settings', 'preferences'), (snap) => {
      if (snap.exists()) {
        const code = snap.data().currency || 'INR';
        setCurrencySymbol(code === 'USD' ? '$' : code === 'EUR' ? '€' : '₹');
      }
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'chats'), orderBy('lastActive', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ChatEntity[];
      setChats(data);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const handleDeleteChat = async (chatId: string) => {
    Alert.alert("Delete Chat?", "This will remove all history and is irreversible.", [
      { text: "Cancel", style: 'cancel' },
      { 
        text: "Delete", 
        style: 'destructive', 
        onPress: async () => {
          await deleteDoc(doc(db, 'users', user.uid, 'chats', chatId));
        }
      }
    ]);
  };

  const { totalOwed, totalDebt } = useMemo(() => {
    let owed = 0, debt = 0;
    chats.forEach(c => c.balance > 0 ? owed += c.balance : debt += Math.abs(c.balance));
    return { totalOwed: owed, totalDebt: debt };
  }, [chats]);

  if (view === 'chat' && activeChat) {
    return <ChatInterface chat={activeChat} onBack={() => { setView('list'); setActiveChat(null); }} user={user} currencySymbol={currencySymbol} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[THEME.bg, '#1e1b4b']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Split & Chat</Text>
          <Text style={styles.headerSub}>Reimburse your vibes</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowNewChatModal(true)}>
          <Plus color="black" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
        {/* DASHBOARD SummaryRow */}
        <View style={styles.summaryRow}>
          <LinearGradient colors={['#065f46', '#059669']} style={styles.summaryCard}>
            <View style={styles.iconCircle}><ArrowUpRight size={18} color="white" /></View>
            <View>
              <Text style={styles.summaryLabel}>You are owed</Text>
              <Text style={styles.summaryValue}>{currencySymbol}{totalOwed.toFixed(0)}</Text>
            </View>
          </LinearGradient>
          <LinearGradient colors={['#9f1239', '#dc2626']} style={styles.summaryCard}>
            <View style={styles.iconCircle}><ArrowDownLeft size={18} color="white" /></View>
            <View>
              <Text style={styles.summaryLabel}>You owe</Text>
              <Text style={styles.summaryValue}>{currencySymbol}{totalDebt.toFixed(0)}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* AGGRESSIVE AD: Between Summary and List */}
        <View style={{paddingHorizontal: 20, marginBottom: 20}}>
          <LinearGradient
            colors={['#3f3f46', '#27272a']}
            style={[styles.sponsoredAd, {flexDirection:'row', alignItems:'center', padding:12, borderRadius:12}]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.adBadge}>
              <Text style={styles.adBadgeText}>SPONSORED</Text>
            </View>
            <Text style={styles.adTitle}>Settle debts instantly with UPI</Text>
            <Megaphone size={16} color="#fbbf24" />
          </LinearGradient>
        </View>

        {/* LIST */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Splits</Text>
          <Text style={{color: '#52525b', fontSize: 10}}>Hold to Delete</Text>
        </View>

        {loading ? <ActivityIndicator color={THEME.primary} style={{ marginTop: 20 }} /> : (
          <View style={styles.listContainer}>
            {chats.length === 0 ? (
               <View style={{alignItems:'center', marginTop: 40}}>
                 <Text style={{color: '#52525b'}}>No splits found. Add one!</Text>
               </View>
            ) : chats.map(chat => (
              <TouchableOpacity 
                key={chat.id} 
                style={styles.chatRow} 
                onPress={() => { setActiveChat(chat); setView('chat'); }}
                onLongPress={() => handleDeleteChat(chat.id)}
                delayLongPress={500}
              >
                <View style={[styles.avatar, { backgroundColor: chat.avatarColor }]}>
                  {chat.type === 'group' ? <Users color="white" size={20} /> : <Text style={styles.avatarText}>{chat.name[0]}</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.friendName}>{chat.name}</Text>
                  <Text style={styles.friendPhone}>{chat.type === 'group' ? `${(chat.members?.length || 0) + 1} people` : chat.phone}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  {chat.balance !== 0 ? (
                    <>
                      <Text style={[styles.balValue, { color: chat.balance > 0 ? THEME.success : THEME.danger }]}>
                        {chat.balance > 0 ? '+' : ''}{currencySymbol}{chat.balance.toFixed(0)}
                      </Text>
                      <Text style={[styles.balLabel, { color: chat.balance > 0 ? THEME.success : THEME.danger }]}>
                        {chat.balance > 0 ? 'owed' : 'debt'}
                      </Text>
                    </>
                  ) : (
                    <View style={styles.settledBadge}><Check size={10} color={THEME.subText} /><Text style={styles.settledText}>Settled</Text></View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <NewChatModal visible={showNewChatModal} onClose={() => setShowNewChatModal(false)} user={user} />
    </View>
  );
}

// --- CHAT INTERFACE ---
function ChatInterface({ chat, onBack, user, currencySymbol }: { chat: ChatEntity, onBack: () => void, user: any, currencySymbol: string }) {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [editingItem, setEditingItem] = useState<FeedItem | null>(null);
  const scrollRef = useRef<FlatList>(null);

  useEffect(() => {
    const q = query(collection(db, 'users', user.uid, 'chats', chat.id, 'feed'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data: any = change.doc.data();
          const createdAtSec = data.createdAt?.seconds ?? (new Date(data.createdAt || 0).getTime() / 1000);
          const isRecent = createdAtSec && createdAtSec > (Date.now() / 1000) - 10;
          if (data.sender !== 'user' && data.paidBy !== 'You' && isRecent) {
            if (data.type === 'expense') {
              sendLocalNotification("New Bill 💸", `${data.paidBy || 'Friend'} added: ${data.description || ''}`);
            } else if (data.type === 'message') {
              sendLocalNotification(`Message from ${chat.name}`, data.text || '');
            }
          }
        }
      });
      setFeed(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FeedItem[]);
    });
    return unsub;
  }, [chat.id, user.uid]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    await addDoc(collection(db, 'users', user.uid, 'chats', chat.id, 'feed'), {
      type: 'message', text: inputText.trim(), sender: 'user', createdAt: serverTimestamp()
    });
    setInputText('');
  };

  const calculateBalanceImpact = (details: any) => {
    const myShare = details.splits['You'] || 0;
    const paidByMe = details.paidBy === 'You';
    return paidByMe ? details.amount - myShare : -myShare;
  };

  const handleSaveExpense = async (details: any) => {
    const newImpact = calculateBalanceImpact(details);
    if (editingItem) {
      const oldImpact = editingItem.balanceImpact || 0;
      const netChange = newImpact - oldImpact;
      await updateDoc(doc(db, 'users', user.uid, 'chats', chat.id, 'feed', editingItem.id), {
        description: details.description, amount: details.amount, paidBy: details.paidBy,
        splitType: details.splitType, splits: details.splits, splitDetails: generateSplitSummary(details), balanceImpact: newImpact
      });
      await updateDoc(doc(db, 'users', user.uid, 'chats', chat.id), { balance: chat.balance + netChange, lastActive: serverTimestamp() });
      setEditingItem(null);
    } else {
      await addDoc(collection(db, 'users', user.uid, 'chats', chat.id, 'feed'), {
        type: 'expense', description: details.description, amount: details.amount, paidBy: details.paidBy,
        splitType: details.splitType, splits: details.splits, splitDetails: generateSplitSummary(details), balanceImpact: newImpact, createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'users', user.uid, 'chats', chat.id), { balance: chat.balance + newImpact, lastActive: serverTimestamp() });
    }
    setShowExpenseModal(false);
  };

  const handleDeleteItem = async (item: FeedItem) => {
    Alert.alert("Delete Item", "Remove this from the chat?", [
      { text: "Cancel", style: 'cancel' },
      { 
        text: "Delete", style: 'destructive',
        onPress: async () => {
          let reverseChange = 0;
          if (item.type === 'expense' && item.balanceImpact) reverseChange = -item.balanceImpact;
          else if (item.type === 'settlement') {
            const wasPaidByMe = item.paidBy === 'user' || item.paidBy === 'You';
            reverseChange = wasPaidByMe ? -item.amount! : item.amount!;
          }
          await deleteDoc(doc(db, 'users', user.uid, 'chats', chat.id, 'feed', item.id));
          if (reverseChange !== 0) await updateDoc(doc(db, 'users', user.uid, 'chats', chat.id), { balance: chat.balance + reverseChange });
        }
      }
    ]);
  };

  const handleEditItem = (item: FeedItem) => {
    if (item.type !== 'expense') return;
    setEditingItem(item);
    setShowExpenseModal(true);
  };

  const generateSplitSummary = (d: any) => {
    if (d.splitType === 'equal') return `Split equally`;
    if (d.splitType === 'percent') return `Split by percentage`;
    return `Unequal split`;
  };

  const settleUp = async () => {
    const impact = -chat.balance;
    await addDoc(collection(db, 'users', user.uid, 'chats', chat.id, 'feed'), {
      type: 'settlement', amount: Math.abs(chat.balance), paidBy: chat.balance > 0 ? chat.name : 'user', 
      balanceImpact: impact, createdAt: serverTimestamp()
    });
    await updateDoc(doc(db, 'users', user.uid, 'chats', chat.id), { balance: 0, lastActive: serverTimestamp() });
    setShowSettleModal(false);
  };

  return (
    <View style={styles.chatContainer}>
      <LinearGradient colors={[THEME.bg, '#18181b']} style={StyleSheet.absoluteFill} />
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={onBack}><ChevronLeft color="white" size={26} /></TouchableOpacity>
        <TouchableOpacity style={{flex:1, flexDirection:'row', alignItems:'center', marginLeft:10}} onPress={() => setShowGroupInfo(true)}>
           <View style={[styles.avatarSmall, { backgroundColor: chat.avatarColor }]}>
             {chat.type === 'group' ? <Users size={18} color="white"/> : <Text style={styles.avatarTextSmall}>{chat.name[0]}</Text>}
           </View>
           <View style={{ marginLeft: 10 }}>
             <Text style={styles.chatName}>{chat.name}</Text>
             <Text style={styles.chatInfo}>
               {chat.balance === 0 ? "Settled" : chat.balance > 0 ? `Owes you ${currencySymbol}${chat.balance.toFixed(0)}` : `You owe ${currencySymbol}${Math.abs(chat.balance).toFixed(0)}`}
             </Text>
           </View>
        </TouchableOpacity>
        {chat.balance !== 0 && (
          <TouchableOpacity style={styles.settleBtnHeader} onPress={() => setShowSettleModal(true)}>
             <Text style={styles.settleBtnText}>Settle</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        ref={scrollRef}
        data={feed}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <FeedItemRow item={item} chat={chat} onDelete={() => handleDeleteItem(item)} onEdit={() => handleEditItem(item)} currencySymbol={currencySymbol} />
        )}
        contentContainerStyle={{ padding: 15, paddingBottom: 20 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0} style={styles.keyboardContainer}>
        <View style={styles.chatFooter}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => { setEditingItem(null); setShowExpenseModal(true); }}>
             <View style={styles.actionIcon}><DollarSign size={22} color="black" /></View>
             <Text style={styles.actionLabel}>Split</Text>
          </TouchableOpacity>
          <View style={styles.inputWrapper}>
            <TextInput style={styles.chatInput} placeholder="Message..." placeholderTextColor="#71717a" value={inputText} onChangeText={setInputText} />
            <TouchableOpacity onPress={sendMessage}><Send size={20} color={inputText.trim() ? THEME.primary : '#52525b'} /></TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <AdvancedExpenseModal visible={showExpenseModal} onClose={() => { setShowExpenseModal(false); setEditingItem(null); }} chat={chat} onSave={handleSaveExpense} initialData={editingItem} currencySymbol={currencySymbol} />
      <SettleModal visible={showSettleModal} onClose={() => setShowSettleModal(false)} chat={chat} onConfirm={settleUp} currencySymbol={currencySymbol} />
      <GroupInfoModal visible={showGroupInfo} onClose={() => setShowGroupInfo(false)} chat={chat} userId={user.uid} />
    </View>
  );
}

const FeedItemRow = ({ item, chat, onDelete, onEdit, currencySymbol }: { item: FeedItem, chat: ChatEntity, onDelete: () => void, onEdit: () => void, currencySymbol: string }) => {
  if (item.type === 'message') {
    const isMe = item.sender === 'user';
    return (
      <TouchableOpacity onLongPress={onDelete} delayLongPress={500} activeOpacity={0.8}>
        <View style={[styles.msgBubble, isMe ? styles.msgRight : styles.msgLeft]}>
          <Text style={[styles.msgText, isMe && {color:'white'}]}>{item.text}</Text>
          <Text style={styles.msgTime}>{item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</Text>
        </View>
      </TouchableOpacity>
    );
  }
  if (item.type === 'settlement') {
    return (
      <TouchableOpacity onLongPress={onDelete} delayLongPress={500}>
        <View style={styles.settleContainer}>
          <View style={styles.settleBadge}>
            <CheckCircle2 size={16} color="white" />
            <Text style={styles.settleText}>{item.paidBy === 'user' ? `You paid ${currencySymbol}${item.amount}` : `${item.paidBy} settled ${currencySymbol}${item.amount}`}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
  const isUserPaid = item.paidBy === 'You' || item.paidBy === 'user';
  return (
    <TouchableOpacity onPress={onEdit} onLongPress={onDelete} delayLongPress={500} activeOpacity={0.9}>
      <View style={styles.expenseContainer}>
        <View style={styles.expenseCard}>
          <View style={[styles.expenseIcon, { backgroundColor: isUserPaid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}>
            <Receipt size={24} color={isUserPaid ? THEME.success : THEME.danger} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.expenseTitle}>{item.description}</Text>
            <Text style={styles.expenseSub}>{isUserPaid ? `You paid ${currencySymbol}${item.amount}` : `${item.paidBy} paid ${currencySymbol}${item.amount}`}</Text>
            {item.splitDetails && <Text style={{color:'#71717a', fontSize:10, marginTop:2}}>{item.splitDetails}</Text>}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.expenseAmount}>{currencySymbol}{item.amount}</Text>
            <Text style={[styles.splitText, { color: isUserPaid ? THEME.success : THEME.danger }]}>
               {isUserPaid ? 'you lent' : 'you borrowed'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// --- UPDATED COMPLEX MODALS WITH VALIDATION ---

const AdvancedExpenseModal = ({ visible, onClose, chat, onSave, initialData, currencySymbol }: any) => {
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('You');
  const [splitType, setSplitType] = useState<'equal' | 'exact' | 'percent'>('equal');
  
  const allMembers = useMemo(() => ['You', ...(chat.members || [])], [chat.members]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [manualValues, setManualValues] = useState<Record<string, string>>({});

  // Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Reset or Load Data
  useEffect(() => {
    if (visible) {
      if (initialData) {
        setDesc(initialData.description);
        setAmount(initialData.amount?.toString() || '');
        setPaidBy(initialData.paidBy || 'You');
        setSplitType(initialData.splitType || 'equal');
        setManualValues(
          allMembers.reduce((acc: any, m: string) => {
            if (initialData.splits && initialData.splits[m]) {
              // Convert stored split to string for input
              const val = initialData.splitType === 'percent' 
                ? (initialData.splits[m] / initialData.amount * 100).toFixed(0) // Approx percent reverse
                : initialData.splits[m].toString();
              acc[m] = val;
            }
            return acc;
          }, {})
        );
        // Determine selected members based on splits
        const involved = Object.keys(initialData.splits || {}).filter(k => initialData.splits[k] > 0);
        setSelectedMembers(involved.length > 0 ? involved : allMembers);
      } else {
        setDesc(''); setAmount(''); setPaidBy('You'); setSplitType('equal'); setManualValues({});
        setSelectedMembers(allMembers);
        setErrors({}); setTouched({});
      }
    }
  }, [visible, initialData, allMembers]);

  // Real-time Validation Effect
  useEffect(() => {
    const newErrors: Record<string, string> = {};
    const total = parseFloat(amount);
    
    // 1. Basic Fields
    if (!desc.trim()) newErrors.desc = "Description is required";
    if (!amount || isNaN(total) || total <= 0) newErrors.amount = "Enter a valid amount";

    // 2. Split Logic
    if (splitType === 'equal') {
      if (selectedMembers.length === 0) newErrors.split = "Select at least one person to split with";
    } 
    else if (splitType === 'exact') {
      let sum = 0;
      allMembers.forEach(m => sum += parseFloat(manualValues[m] || '0'));
      if (Math.abs(sum - total) > 0.01) {
        newErrors.split = `Sum: ${currencySymbol}${sum.toFixed(2)} / Total: ${currencySymbol}${total.toFixed(2)}`;
      }
    } 
    else if (splitType === 'percent') {
      let sum = 0;
      allMembers.forEach(m => sum += parseFloat(manualValues[m] || '0'));
      if (Math.abs(sum - 100) > 0.1) {
        newErrors.split = `Total: ${sum.toFixed(1)}% (Must be 100%)`;
      }
    }

    setErrors(newErrors);
  }, [desc, amount, splitType, selectedMembers, manualValues, currencySymbol]);

  const toggleMember = (m: string) => {
    if (selectedMembers.includes(m)) setSelectedMembers(prev => prev.filter(x => x !== m));
    else setSelectedMembers(prev => [...prev, m]);
  };

  const handleManualChange = (m: string, val: string) => {
    setManualValues(prev => ({ ...prev, [m]: val }));
  };

  const handleSubmit = () => {
    // Mark all as touched to show errors
    setTouched({ desc: true, amount: true, split: true });

    if (Object.keys(errors).length > 0) {
      // Find the first error to alert user vaguely or just let the UI show it
      return; 
    }

    const total = parseFloat(amount);
    const splits: Record<string, number> = {};

    if (splitType === 'equal') {
      const share = total / selectedMembers.length;
      selectedMembers.forEach(m => splits[m] = share);
    } 
    else if (splitType === 'exact') {
      allMembers.forEach(m => splits[m] = parseFloat(manualValues[m] || '0'));
    } 
    else if (splitType === 'percent') {
      allMembers.forEach(m => {
        const pct = parseFloat(manualValues[m] || '0');
        splits[m] = (pct / 100) * total;
      });
    }

    onSave({ description: desc, amount: total, paidBy, splitType, splits });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{initialData ? 'Edit Expense' : 'Add Expense'}</Text>
          <TouchableOpacity onPress={onClose}><X size={24} color="white" /></TouchableOpacity>
        </View>

        {/* Description Input */}
        <View style={{ marginBottom: 20 }}>
          <View style={{flexDirection:'row', alignItems:'center', gap:10}}>
            <View style={[styles.iconBox, touched.desc && errors.desc ? {backgroundColor: 'rgba(239, 68, 68, 0.2)'} : {}]}>
              <Receipt color={touched.desc && errors.desc ? THEME.danger : THEME.primary} size={24} />
            </View>
            <TextInput 
              style={{fontSize:20, color:'white', fontWeight:'bold', flex:1}} 
              placeholder="Description" 
              placeholderTextColor="#52525b"
              value={desc} 
              onChangeText={setDesc}
              onBlur={() => setTouched(prev => ({...prev, desc: true}))}
            />
          </View>
          {touched.desc && errors.desc && <Text style={styles.errorText}>{errors.desc}</Text>}
        </View>

        {/* Amount Input */}
        <View style={{ marginBottom: 20 }}>
          <View style={{flexDirection:'row', alignItems:'center', justifyContent:'center'}}>
             <Text style={{fontSize:32, color:'white', fontWeight:'bold'}}>{currencySymbol}</Text>
             <TextInput 
               style={{fontSize:48, color:'white', fontWeight:'bold', minWidth:50}} 
               placeholder="0" placeholderTextColor="#52525b" 
               keyboardType="numeric" value={amount} onChangeText={setAmount}
               onBlur={() => setTouched(prev => ({...prev, amount: true}))} 
             />
          </View>
          {touched.amount && errors.amount && <Text style={[styles.errorText, {textAlign:'center'}]}>{errors.amount}</Text>}
        </View>

        {/* Paid By */}
        <View style={{marginBottom: 20}}>
           <Text style={styles.label}>Paid By</Text>
           <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexDirection:'row'}}>
             {allMembers.map(m => (
               <TouchableOpacity key={m} onPress={() => setPaidBy(m)} style={[styles.chip, paidBy === m && styles.chipActive]}>
                 <Text style={[styles.chipText, paidBy === m && {color:'white'}]}>{m}</Text>
               </TouchableOpacity>
             ))}
           </ScrollView>
        </View>

        {/* Split Method */}
        <View style={{marginBottom: 10}}>
           <Text style={styles.label}>Split Method</Text>
           <View style={styles.tabRow}>
             {[
               {id:'equal', label:'Equally', icon: Divide}, 
               {id:'exact', label:'Exact Amt', icon: DollarSign}, 
               {id:'percent', label:'Percent %', icon: PieChart}
              ].map(t => (
               <TouchableOpacity key={t.id} onPress={() => setSplitType(t.id as any)} style={[styles.tabBtn, splitType === t.id && styles.tabBtnActive]}>
                 <t.icon size={16} color={splitType === t.id ? 'white' : '#a1a1aa'} />
                 <Text style={[styles.tabText, splitType === t.id && {color:'white'}]}>{t.label}</Text>
               </TouchableOpacity>
             ))}
           </View>
        </View>

        {/* Error / Status Bar for Splits */}
        {(splitType !== 'equal' || (touched.split && errors.split)) && (
          <View style={[styles.validationBanner, errors.split ? {backgroundColor: 'rgba(239, 68, 68, 0.2)'} : {backgroundColor: 'rgba(16, 185, 129, 0.2)'}]}>
             {errors.split ? <AlertCircle size={14} color={THEME.danger} /> : <Check size={14} color={THEME.success} />}
             <Text style={{color: errors.split ? THEME.danger : THEME.success, fontWeight:'bold', fontSize:12}}>
               {errors.split || (splitType === 'exact' ? 'Amounts match total' : 'Percentages total 100%')}
             </Text>
          </View>
        )}

        <ScrollView style={{flex:1}}>
          {allMembers.map(m => {
            const isSelected = selectedMembers.includes(m);
            return (
              <View key={m} style={styles.memberRow}>
                <View style={{flexDirection:'row', alignItems:'center', gap:10}}>
                   <View style={styles.avatarMini}><Text style={{color:'white'}}>{m[0]}</Text></View>
                   <Text style={{color:'white', fontSize:16}}>{m}</Text>
                </View>

                {splitType === 'equal' && (
                  <Switch 
                    value={isSelected} 
                    onValueChange={() => toggleMember(m)} 
                    trackColor={{false:'#27272a', true:THEME.primary}} 
                  />
                )}

                {(splitType === 'exact' || splitType === 'percent') && (
                  <TextInput 
                    style={[styles.smallInput, errors.split ? {borderColor: THEME.danger} : {}]} 
                    placeholder="0" 
                    placeholderTextColor="#52525b" 
                    keyboardType="numeric"
                    value={manualValues[m] || ''}
                    onChangeText={(t) => handleManualChange(m, t)}
                  />
                )}
              </View>
            );
          })}
        </ScrollView>

        <TouchableOpacity 
          style={[styles.saveBtn, Object.keys(errors).length > 0 && {backgroundColor: '#3f3f46', opacity: 0.8}]} 
          onPress={handleSubmit}
          disabled={Object.keys(errors).length > 0 && Object.keys(touched).length > 0} // Only disable if touched and errored
        >
          <Text style={[styles.saveBtnText, Object.keys(errors).length > 0 && Object.keys(touched).length > 0 && {color: '#71717a'}]}>
             {initialData ? 'Update' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

// --- UPDATED GROUP INFO MODAL WITH VALIDATION ---

const GroupInfoModal = ({ visible, onClose, chat, userId }: any) => {
  const [adding, setAdding] = useState(false);
  const [newMember, setNewMember] = useState('');
  const [error, setError] = useState('');

  const handleAddMember = async () => {
    if (!newMember.trim()) {
      setError('Name cannot be empty');
      return;
    }
    if (chat.members.includes(newMember.trim())) {
      setError('Member already exists');
      return;
    }
    try {
      await updateDoc(doc(db, 'users', userId, 'chats', chat.id), { members: arrayUnion(newMember.trim()) });
      setNewMember(''); setAdding(false); setError('');
    } catch (e) { Alert.alert("Error", "Could not add member"); }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalIndicator} />
          <Text style={styles.modalTitle}>{chat.name}</Text>
          <Text style={{color:THEME.subText, textAlign:'center', marginBottom:20}}>Group Details</Text>
          <Text style={styles.label}>Members</Text>
          <ScrollView style={{maxHeight: 200, marginBottom: 20}}>
             <View style={styles.memberRow}>
                <View style={[styles.avatarMini, {backgroundColor: THEME.primary}]}><Text style={{color:'white'}}>Y</Text></View>
                <Text style={{color:'white', fontSize:16}}>You</Text>
             </View>
             {chat.members?.map((m: string) => (
               <View key={m} style={styles.memberRow}>
                  <View style={styles.avatarMini}><Text style={{color:'white'}}>{m[0]}</Text></View>
                  <Text style={{color:'white', fontSize:16}}>{m}</Text>
               </View>
             ))}
          </ScrollView>
          {adding ? (
            <View style={{marginTop: 10}}>
              <TextInput 
                style={[styles.input, error ? {borderColor: THEME.danger} : {}]} 
                placeholder="Enter Name" 
                placeholderTextColor="#52525b" 
                value={newMember} 
                onChangeText={(t) => {setNewMember(t); setError('');}} 
                autoFocus 
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddMember}><Text style={styles.saveBtnText}>Save</Text></TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.outlineBtn} onPress={() => setAdding(true)}>
              <UserPlus size={18} color="white" /><Text style={{color:'white', fontWeight:'bold'}}>Add Member</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onClose} style={{marginTop:15, alignItems:'center'}}><Text style={{color:'#71717a'}}>Close</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// --- UPDATED NEW CHAT MODAL WITH VALIDATION ---

const NewChatModal = ({ visible, onClose, user }: any) => {
  const [name, setName] = useState('');
  const [mode, setMode] = useState('friend');

  const handleCreate = async () => {
     if(!name) return;
     const color = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6'][Math.floor(Math.random()*5)];
     await addDoc(collection(db, 'users', user.uid, 'chats'), {
       name, type: mode, members: [], avatarColor: color, balance: 0, lastActive: serverTimestamp()
     });
     onClose(); setName('');
  }

  // --- UPDATED CONTACT PERMISSION HANDLING ---
  const importContact = async () => {
     try {
       const { status, canAskAgain } = await Contacts.requestPermissionsAsync();
       
       if (status === 'granted') {
         const { data } = await Contacts.getContactsAsync({ fields: [Contacts.Fields.Name] });
         if (data.length > 0) {
           // Currently just grabs the first contact as a placeholder. 
           // In a real app, you'd likely show a list here.
           setName(data[0].name); 
         } else {
           Alert.alert("No Contacts", "Your contact list appears to be empty.");
         }
       } else {
         // Handle Denial Gracefully
         Alert.alert(
           "Permission Required",
           "We need access to your contacts to find your friends easily.",
           [
             { text: "Cancel", style: "cancel" },
             { 
               text: "Open Settings", 
               onPress: () => Linking.openSettings() // Works on both Android & iOS
             }
           ]
         );
       }
     } catch (e) {
       console.log(e);
       Alert.alert("Error", "Something went wrong fetching contacts.");
     }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>New Split</Text>
        <View style={styles.tabSwitch}>
          <TouchableOpacity onPress={() => setMode('friend')} style={[styles.tabBtn, mode==='friend' && styles.tabBtnActive]}><Text style={[styles.tabText, mode==='friend' && {color:'white'}]}>Friend</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setMode('group')} style={[styles.tabBtn, mode==='group' && styles.tabBtnActive]}><Text style={[styles.tabText, mode==='group' && {color:'white'}]}>Group</Text></TouchableOpacity>
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} placeholder="Name" placeholderTextColor="#52525b" value={name} onChangeText={setName} />
          
          {/* Import Button */}
          {mode === 'friend' && (
            <TouchableOpacity onPress={importContact} style={{flexDirection: 'row', alignItems: 'center', marginTop: 5}}>
              <Users size={14} color={THEME.primary} style={{marginRight: 4}} />
              <Text style={{color: THEME.primary, fontWeight: '600'}}>Import from Contacts</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.saveBtn} onPress={handleCreate}><Text style={styles.saveBtnText}>Create</Text></TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={{marginTop:20, alignItems:'center'}}><Text style={{color:'#71717a'}}>Cancel</Text></TouchableOpacity>
      </View>
    </Modal>
  );
};

const SettleModal = ({ visible, onClose, chat, onConfirm, currencySymbol }: any) => (
    <Modal visible={visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalIndicator} />
                <View style={{alignItems:'center', marginVertical: 20}}>
                    <CheckCircle2 size={64} color={THEME.success} />
                    <Text style={[styles.modalTitle, {marginTop: 20}]}>Settle Up?</Text>
                    <Text style={{fontSize: 32, fontWeight:'900', color: 'white', marginVertical: 10}}>{currencySymbol}{Math.abs(chat.balance).toFixed(0)}</Text>
                    <Text style={{color: THEME.subText, textAlign:'center'}}>This will reset the balance to zero.</Text>
                </View>
                <TouchableOpacity style={[styles.saveBtn, {backgroundColor: THEME.success}]} onPress={onConfirm}><Text style={styles.saveBtnText}>Record Cash Payment</Text></TouchableOpacity>
                <TouchableOpacity onPress={onClose} style={{alignItems:'center', marginTop:15}}><Text style={{color:'#71717a'}}>Cancel</Text></TouchableOpacity>
            </View>
        </View>
    </Modal>
);

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: '900', color: 'white' },
  headerSub: { color: THEME.subText, fontSize: 14 },
  addBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: THEME.primary, alignItems: 'center', justifyContent: 'center' },
  summaryRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 25 },
  summaryCard: { flex: 1, padding: 16, borderRadius: 20 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
  summaryValue: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', paddingLeft: 20, marginBottom: 10, paddingRight: 20 },
  sectionTitle: { color: THEME.subText, fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  listContainer: { paddingHorizontal: 20 },
  chatRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181b', padding: 16, borderRadius: 18, marginBottom: 10, borderWidth: 1, borderColor: '#27272a' },
  avatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  avatarText: { color: 'white', fontWeight: 'bold', fontSize: 20 },
  friendName: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  friendPhone: { color: '#71717a', fontSize: 12 },
  balValue: { fontSize: 16, fontWeight: 'bold', textAlign: 'right' },
  balLabel: { fontSize: 11, textAlign: 'right', fontWeight: '600' },
  settledBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#27272a', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  settledText: { color: THEME.subText, fontSize: 12 },
  chatContainer: { flex: 1, backgroundColor: '#09090b' },
  chatHeader: { paddingTop: 60, paddingBottom: 15, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181b', borderBottomWidth: 1, borderBottomColor: '#27272a', zIndex: 10 },
  avatarSmall: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarTextSmall: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  chatName: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  chatInfo: { color: THEME.subText, fontSize: 12 },
  settleBtnHeader: { backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginLeft: 'auto' },
  settleBtnText: { color: THEME.success, fontWeight: 'bold', fontSize: 12 },
  msgBubble: { padding: 12, borderRadius: 16, marginBottom: 12, maxWidth: '75%' },
  msgLeft: { backgroundColor: '#27272a', alignSelf: 'flex-start', borderBottomLeftRadius: 2 },
  msgRight: { backgroundColor: THEME.primary, alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  msgText: { color: '#e4e4e7', fontSize: 15 },
  msgTime: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  expenseContainer: { width: '100%', alignItems: 'center', marginVertical: 10 },
  expenseCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#27272a', width: '90%', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#3f3f46' },
  expenseIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  expenseTitle: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  expenseSub: { color: '#a1a1aa', fontSize: 12 },
  expenseAmount: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  splitText: { fontSize: 11, fontWeight: '600', marginTop: 2, textAlign: 'right' },
  settleContainer: { alignItems: 'center', marginVertical: 15 },
  settleBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  settleText: { color: 'white', fontSize: 12, fontWeight: '600' },
  keyboardContainer: { width: '100%', backgroundColor: '#18181b', marginBottom: 80 },
  chatFooter: { flexDirection: 'row', padding: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#27272a', gap: 10 },
  actionBtn: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  actionIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: THEME.success, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  actionLabel: { color: '#a1a1aa', fontSize: 10 },
  inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#27272a', borderRadius: 25, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: '#3f3f46' },
  chatInput: { flex: 1, color: 'white', marginRight: 10 },
  modalContainer: { flex: 1, backgroundColor: '#18181b', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 20 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#18181b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 25, paddingBottom: 50 },
  modalIndicator: { width: 40, height: 5, backgroundColor: '#3f3f46', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  saveBtn: { backgroundColor: THEME.primary, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#27272a', alignItems: 'center', justifyContent: 'center' },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#27272a', marginRight: 8, borderWidth: 1, borderColor: '#3f3f46' },
  chipActive: { backgroundColor: THEME.primary, borderColor: THEME.primary },
  chipText: { color: '#a1a1aa', fontWeight: 'bold' },
  label: { color: '#a1a1aa', fontSize: 12, fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase' },
  tabRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: '#27272a', borderWidth: 1, borderColor: '#3f3f46' },
  tabBtnActive: { backgroundColor: '#3f3f46', borderColor: 'white' },
  tabText: { color: '#a1a1aa', fontWeight: 'bold', fontSize: 12 },
  memberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#27272a' },
  avatarMini: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#3f3f46', alignItems: 'center', justifyContent: 'center' },
  smallInput: { width: 80, padding: 8, backgroundColor: '#27272a', borderRadius: 8, color: 'white', textAlign: 'right', borderWidth: 1, borderColor: '#3f3f46' },
  outlineBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#3f3f46', marginTop: 10 },
  tabSwitch: { flexDirection: 'row', backgroundColor: '#27272a', borderRadius: 12, padding: 4, marginBottom: 25 },
  input: { backgroundColor: '#27272a', color: 'white', padding: 16, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: '#3f3f46', marginBottom: 15 },
  formGroup: { marginBottom: 20 },
  // NEW STYLES
  errorText: { color: THEME.danger, fontSize: 12, marginTop: -10, marginBottom: 15, marginLeft: 5 },
  validationBanner: { flexDirection: 'row', alignItems:'center', gap: 6, padding: 10, borderRadius: 8, marginBottom: 10 },
  sponsoredAd: {
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  adBadge: {
    backgroundColor: 'white',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 10,
  },
  adBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: 'black',
  },
  adTitle: {
    color: 'white',
    fontWeight: 'bold',
    flex: 1,
  },
});