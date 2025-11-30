import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Home, PieChart, Plus, Users, User } from 'lucide-react-native'; // Standard Cross-platform Icons

import { HapticTab } from '../../components/haptic-tab';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <LinearGradient
      colors={['#09090b', '#18181b']} // Hardcoded dark theme for consistency
      style={{ flex: 1 }}
    >
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#8b5cf6', // Purple active color
          tabBarInactiveTintColor: '#71717a', // Grey inactive
          tabBarShowLabel: false,
          tabBarButton: HapticTab,
          tabBarStyle: styles.tabBar,
        }}>
        
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          }}
        />

        <Tabs.Screen
          name="insights"
          options={{
            title: 'Insights',
            tabBarIcon: ({ color }) => <PieChart size={24} color={color} />,
          }}
        />

        {/* Center Add Button */}
        <Tabs.Screen
          name="add"
          options={{
            title: 'Add',
            // Custom big button design
            tabBarIcon: ({ color }) => (
              <View style={styles.plusBtn}>
                <Plus size={28} color="white" />
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="explore"
          options={{
            title: 'Split',
            tabBarIcon: ({ color }) => <Users size={24} color={color} />,
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <User size={24} color={color} />,
          }}
        />
      </Tabs>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(24, 24, 27, 0.95)', // Dark background
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    elevation: 10, // Shadow for Android
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    paddingBottom: 0, // Fixes alignment on some devices
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#8b5cf6', // Primary Purple
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20, // Floating effect lifting it out of the bar
    borderWidth: 4,
    borderColor: '#09090b', // Matches background to create "cutout" look
    elevation: 5,
  }
});