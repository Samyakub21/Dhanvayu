/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, 
  Dimensions, ActivityIndicator, Alert, Share 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Search, ChevronLeft, ChevronRight, FileText, FileSpreadsheet, X 
} from 'lucide-react-native';
import { PieChart } from 'react-native-chart-kit';
import { collection, query, orderBy, onSnapshot, Firestore, doc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig'; 
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// --- 1. SHARED THEME (Matches index.tsx & explore.tsx) ---
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
};

// --- 2. SHARED CATEGORIES (Matches index.tsx) ---
const CATEGORIES = [
  { id: 'food', label: 'Munchies', color: '#f59e0b' },
  { id: 'transport', label: 'Commute', color: '#3b82f6' },
  { id: 'shopping', label: 'Drip', color: '#ec4899' },
  { id: 'tech', label: 'Tech', color: '#8b5cf6' },
  { id: 'bills', label: 'Bills', color: '#ef4444' },
  { id: 'fun', label: 'Vibes', color: '#10b981' },
];

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function InsightsScreen() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // NEW: currency symbol state (listens to user preferences)
  const [currencySymbol, setCurrencySymbol] = useState('₹');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState(new Date()); // Controls the Month View

  // --- 3. DATABASE CONNECTION (Same collection as Home) ---
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Listens to the exact same data source as your Home Screen
    const q = query(collection(db as Firestore, 'users', user.uid, 'expenses'), orderBy('date', 'desc'));
    
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTransactions(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  // NEW: Listen for currency preference changes
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const unsub = onSnapshot(doc(db as Firestore, 'users', user.uid, 'settings', 'preferences'), (snap) => {
      if (snap.exists()) {
        const code = (snap.data() as any).currency || 'INR';
        setCurrencySymbol(code === 'USD' ? '$' : code === 'EUR' ? '€' : '₹');
      }
    });
    return unsub;
  }, []);

  // --- FILTER LOGIC ---
  const filteredData = useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      const isSameMonth = tDate.getMonth() === viewDate.getMonth() && 
                          tDate.getFullYear() === viewDate.getFullYear();
      
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Match category OR if "Income" is selected (since income doesn't have a standard category ID usually)
      const matchesCat = selectedCat 
        ? (selectedCat === 'income' ? t.type === 'income' : t.category === selectedCat)
        : true;

      return isSameMonth && matchesSearch && matchesCat;
    });
  }, [transactions, searchQuery, selectedCat, viewDate]);

  // --- CHART DATA (Expenses Only) ---
  const chartData = useMemo(() => {
    const expensesOnly = filteredData.filter(t => t.type !== 'income');
    
    return CATEGORIES.map(cat => {
      const total = expensesOnly
        .filter(t => t.category === cat.id)
        .reduce((sum, t) => sum + t.amount, 0);
      
      return {
        name: cat.label,
        population: total,
        color: cat.color,
        legendFontColor: "#a1a1aa",
        legendFontSize: 12
      };
    }).filter(item => item.population > 0);
  }, [filteredData]);

  // --- EXPORT PDF ---
  // --- EXPORT PDF (Fixed Layout) ---
  const handleExportPDF = async () => {
    try {
      const symbol = currencySymbol || '₹'; // use dynamic symbol

      // 1. Calculate Totals for the Report
      const totalIncome = filteredData
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalExpense = filteredData
        .filter(t => t.type !== 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const netSavings = totalIncome - totalExpense;

      // 2. Generate Clean HTML for A4 Paper (use symbol)
      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
              .header { margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #8b5cf6; }
              h1 { color: #8b5cf6; margin: 0; font-size: 24px; }
              .subtitle { color: #666; font-size: 14px; margin-top: 5px; }
              
              .summary-box { display: flex; justify-content: space-between; margin-bottom: 30px; background: #f9fafb; padding: 15px; border-radius: 8px; }
              .summary-item { text-align: center; }
              .label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
              .value { font-size: 18px; font-weight: bold; margin-top: 5px; }
              .income { color: #10b981; }
              .expense { color: #ef4444; }

              table { width: 100%; border-collapse: collapse; font-size: 12px; }
              th { text-align: left; background: #f3f4f6; padding: 12px 8px; border-bottom: 2px solid #ddd; color: #444; }
              td { padding: 12px 8px; border-bottom: 1px solid #eee; }
              tr:nth-child(even) { background-color: #fcfcfc; }
              .amt-col { text-align: right; font-family: monospace; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>DhanVayu Statement</h1>
              <div class="subtitle">Generated on ${new Date().toLocaleDateString()}</div>
              <div class="subtitle">Period: ${viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
            </div>

            <div class="summary-box">
              <div class="summary-item">
                <div class="label">Total Income</div>
                <div class="value income">+${symbol}${totalIncome.toLocaleString()}</div>
              </div>
              <div class="summary-item">
                <div class="label">Total Spent</div>
                <div class="value expense">-${symbol}${totalExpense.toLocaleString()}</div>
              </div>
              <div class="summary-item">
                <div class="label">Net Savings</div>
                <div class="value">${symbol}${netSavings.toLocaleString()}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th style="text-align:right">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${filteredData.map(t => {
                  const catObj = CATEGORIES.find(c => c.id === t.category);
                  const catLabel = t.type === 'income' ? 'Income' : (catObj ? catObj.label : 'Misc');
                  const isIncome = t.type === 'income';
                  
                  return `
                    <tr>
                      <td>${new Date(t.date).toLocaleDateString()}</td>
                      <td><strong>${t.title}</strong></td>
                      <td>${catLabel}</td>
                      <td class="amt-col" style="color: ${isIncome ? '#10b981' : '#ef4444'}">
                        ${isIncome ? '+' : '-'}${symbol}${t.amount}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
            
            <div style="margin-top: 40px; text-align: center; color: #aaa; font-size: 10px;">
              End of Report • DhanVayu App
            </div>
          </body>
        </html>
      `;

      // 3. Print
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });

    } catch (e) {
      Alert.alert("Export Error", "Could not generate PDF. Please try again.");
    }
  };

  // --- EXPORT CSV ---
  const handleExportCSV = async () => {
    try {
      const header = 'Date,Title,Category,Type,Amount\n';
      const rows = filteredData.map(t => {
        const catLabel = CATEGORIES.find(c => c.id === t.category)?.label || 'Income/Misc';
        return `${new Date(t.date).toLocaleDateString()},"${t.title}",${catLabel},${t.type || 'expense'},${t.amount}`;
      }).join('\n');
      
      const csvString = header + rows;
      Share.share({ message: csvString, title: "DhanVayu_Export.csv" });
    } catch (e) {
      Alert.alert("Error", "Could not export CSV");
    }
  };

  const changeMonth = (dir: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + dir);
    setViewDate(newDate);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[THEME.bg, '#1e1b4b']} style={StyleSheet.absoluteFill} />
      
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Analytics & History</Text>
      </View>

      {/* MONTH NAV */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
          <ChevronLeft color="white" size={24} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navBtn}>
          <ChevronRight color="white" size={24} />
        </TouchableOpacity>
      </View>

      {/* FILTERS */}
      <View style={styles.filterContainer}>
        <View style={styles.searchBox}>
          <Search size={18} color={THEME.subText} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search transactions..."
            placeholderTextColor={THEME.subText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
             <TouchableOpacity onPress={() => setSearchQuery('')}>
               <X size={16} color={THEME.subText} />
             </TouchableOpacity>
          )}
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
          <TouchableOpacity 
             style={[styles.catChip, !selectedCat && styles.catChipActive]} 
             onPress={() => setSelectedCat(null)}
          >
            <Text style={[styles.catText, !selectedCat && {color:'white'}]}>All</Text>
          </TouchableOpacity>
          
          {/* Income Chip */}
          <TouchableOpacity 
             style={[styles.catChip, selectedCat === 'income' && { backgroundColor: THEME.success, borderColor: THEME.success }]} 
             onPress={() => setSelectedCat(selectedCat === 'income' ? null : 'income')}
          >
            <Text style={[styles.catText, selectedCat === 'income' && {color:'white'}]}>💰 Income</Text>
          </TouchableOpacity>

          {/* Expense Categories */}
          {CATEGORIES.map(cat => (
            <TouchableOpacity 
              key={cat.id} 
              style={[styles.catChip, selectedCat === cat.id && { backgroundColor: cat.color, borderColor: cat.color }]} 
              onPress={() => setSelectedCat(selectedCat === cat.id ? null : cat.id)}
            >
              <Text style={[styles.catText, selectedCat === cat.id && {color:'white'}]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* CHARTS (Only show if expenses exist) */}
        {chartData.length > 0 && selectedCat !== 'income' ? (
          <View style={styles.chartCard}>
            <Text style={styles.sectionHeader}>Where did it go?</Text>
            <PieChart
              data={chartData}
              width={SCREEN_WIDTH - 60}
              height={200}
              chartConfig={{
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              }}
              accessor={"population"}
              backgroundColor={"transparent"}
              paddingLeft={"15"}
              center={[0, 0]}
              absolute
            />
          </View>
        ) : (
          <View style={styles.emptyChart}>
             <Text style={{color: THEME.subText}}>
               {selectedCat === 'income' ? "Income View Mode" : "No expense data for this period."}
             </Text>
          </View>
        )}

        {/* EXPORT OPTIONS */}
        <View style={styles.exportRow}>
          <TouchableOpacity style={styles.exportBtn} onPress={handleExportPDF}>
            <FileText size={20} color="white" />
            <Text style={styles.exportText}>PDF Report</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.exportBtn, {backgroundColor: '#059669'}]} onPress={handleExportCSV}>
            <FileSpreadsheet size={20} color="white" />
            <Text style={styles.exportText}>CSV Export</Text>
          </TouchableOpacity>
        </View>

        {/* HISTORY LIST */}
        <Text style={[styles.sectionHeader, {marginLeft: 20, marginTop: 25}]}>Transactions</Text>
        
        {loading ? <ActivityIndicator color={THEME.primary} style={{marginTop: 20}} /> : (
          <View style={{ paddingHorizontal: 20 }}>
            {filteredData.length === 0 ? (
               <Text style={{color: '#52525b', textAlign: 'center', marginTop: 20}}>No results found.</Text>
            ) : (
               filteredData.map(item => {
                 const isIncome = item.type === 'income';
                 return (
                   <View key={item.id} style={styles.txRow}>
                     <View>
                       <Text style={styles.txTitle}>{item.title}</Text>
                       <Text style={styles.txDate}>{new Date(item.date).toLocaleDateString()}</Text>
                     </View>
                     <Text style={[styles.txAmount, { color: isIncome ? THEME.success : THEME.text }]}>
                       {isIncome ? '+' : '-'}{currencySymbol}{item.amount}
                     </Text>
                   </View>
                 );
               })
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15 },
  title: { fontSize: 28, fontWeight: '900', color: 'white' },
  
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  monthTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', width: 160, textAlign: 'center' },
  navBtn: { padding: 10, backgroundColor: '#27272a', borderRadius: 20 },

  filterContainer: { paddingHorizontal: 20, marginBottom: 10 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#27272a', paddingHorizontal: 15, borderRadius: 12, height: 50, borderWidth: 1, borderColor: '#3f3f46' },
  searchInput: { flex: 1, color: 'white', marginLeft: 10, fontSize: 16 },
  
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#3f3f46', marginRight: 8, backgroundColor: '#18181b' },
  catChipActive: { backgroundColor: 'white', borderColor: 'white' },
  catText: { color: '#a1a1aa', fontWeight: '600', fontSize: 12 },

  chartCard: { margin: 20, padding: 20, backgroundColor: 'rgba(24, 24, 27, 0.6)', borderRadius: 24, borderWidth: 1, borderColor: '#3f3f46', alignItems: 'center' },
  emptyChart: { margin: 20, padding: 30, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#3f3f46', borderRadius: 20 },
  
  sectionHeader: { color: THEME.subText, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 15, letterSpacing: 1 },

  exportRow: { flexDirection: 'row', gap: 15, paddingHorizontal: 20, marginTop: 10 },
  exportBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: THEME.primary, padding: 15, borderRadius: 16 },
  exportText: { color: 'white', fontWeight: 'bold' },

  txRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  txTitle: { color: 'white', fontWeight: '600', fontSize: 16 },
  txDate: { color: THEME.subText, fontSize: 12, marginTop: 4 },
  txAmount: { fontSize: 16, fontWeight: 'bold' },
});