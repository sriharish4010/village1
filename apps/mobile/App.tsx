import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView, TextInput, StatusBar } from 'react-native';

export default function App() {
  const [selectedVillage, setSelectedVillage] = useState('Alanganallur, Madurai');
  const [activeTab, setActiveTab] = useState<'customer' | 'shopkeeper'>('customer');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#059669" />
      
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>V1</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.brandTitle}>Village1</Text>
          <Text style={styles.brandSubtitle}>Local Village Commerce Platform</Text>
        </View>
      </View>

      {/* Village Location Bar */}
      <View style={styles.villageBar}>
        <Text style={styles.villageLabel}>📍 Active Village:</Text>
        <Text style={styles.villageValue}>{selectedVillage}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Discover Your Neighborhood Shops</Text>
          <Text style={styles.heroSubtitle}>
            Order daily groceries, book salon queue appointments, and collect with zero waiting time.
          </Text>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'customer' && styles.tabButtonActive]}
            onPress={() => setActiveTab('customer')}
          >
            <Text style={[styles.tabText, activeTab === 'customer' && styles.tabTextActive]}>Customer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'shopkeeper' && styles.tabButtonActive]}
            onPress={() => setActiveTab('shopkeeper')}
          >
            <Text style={[styles.tabText, activeTab === 'shopkeeper' && styles.tabTextActive]}>Shopkeeper</Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <Text style={styles.sectionTitle}>Shop Categories</Text>
        <View style={styles.categoriesGrid}>
          {['🛒 Groceries', '✂️ Salons', '🍞 Bakeries', '✨ Fancy Stores', '📚 Stationery'].map((item) => (
            <View key={item} style={styles.categoryPill}>
              <Text style={styles.categoryText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Pilot Merchants in Village */}
        <Text style={styles.sectionTitle}>Verified Village Shops</Text>
        
        <View style={styles.shopCard}>
          <Text style={styles.shopName}>Murugan Maligai Store 🛒</Text>
          <Text style={styles.shopCategory}>Grocery Provisions • Main Bazaar Road</Text>
          <Text style={styles.shopStatus}>✓ Verified & Open (7:30 AM - 9:30 PM)</Text>
          <View style={styles.tagRow}>
            <Text style={styles.tag}>Pay-at-Shop</Text>
            <Text style={styles.tag}>Fresh Rice & Oils</Text>
          </View>
        </View>

        <View style={styles.shopCard}>
          <Text style={styles.shopName}>Karthik Men's Hair Studio ✂️</Text>
          <Text style={styles.shopCategory}>Salon & Grooming • Bus Stand Complex</Text>
          <Text style={styles.shopStatus}>✓ Digital Queue Tokens Enabled</Text>
          <View style={styles.tagRow}>
            <Text style={styles.tag}>AC Studio</Text>
            <Text style={styles.tag}>Queue Tracking</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#059669',
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#059669',
    fontWeight: 'bold',
    fontSize: 18,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  brandSubtitle: {
    color: '#D1FAE5',
    fontSize: 11,
  },
  villageBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ECFDF5',
    borderBottomWidth: 1,
    borderBottomColor: '#A7F3D0',
  },
  villageLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#065F46',
    marginRight: 6,
  },
  villageValue: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    padding: 3,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#059669',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  categoryPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  shopCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  shopName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  shopCategory: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  shopStatus: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginTop: 6,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  tag: {
    fontSize: 11,
    backgroundColor: '#F1F5F9',
    color: '#475569',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
});
