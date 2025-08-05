import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../styles/globalStyles';
import { colors } from '../styles/theme';
import { useApp } from '../context/AppContext';
import SolanaService from '../services/SolanaService';
import NFCService from '../services/NFCService';
import DemoControls from '../components/DemoControls';
import { 
  formatSOL, 
  truncatePublicKey, 
  checkOnlineStatus,
  getRelativeTime 
} from '../utils/helpers';

const HomeScreen = ({ navigation }) => {
  const { state, actions } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Check network status
      const isOnline = await checkOnlineStatus();
      actions.setOnlineStatus(isOnline);

      // Initialize NFC
      const nfcStatus = await NFCService.initialize();
      actions.setNFCStatus(nfcStatus.enabled, nfcStatus.supported);

      // Update wallet balance if online
      if (isOnline && state.wallet?.publicKey) {
        await updateWalletBalance();
      }
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  };

  const updateWalletBalance = async () => {
    try {
      if (state.wallet?.publicKey) {
        const balance = await SolanaService.getBalance(state.wallet.publicKey);
        setWalletBalance(balance);
      }
    } catch (error) {
      console.error('Error updating wallet balance:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await initializeApp();
    setRefreshing(false);
  };

  const handleCreatePayment = () => {
    if (!state.nfcSupported) {
      Alert.alert(
        'NFC Not Supported',
        'This device does not support NFC functionality required for offline payments.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!state.nfcEnabled) {
      Alert.alert(
        'Enable NFC',
        'Please enable NFC in your device settings to create payments.',
        [
          { text: 'Cancel' },
          { text: 'Settings', onPress: () => NFCService.promptEnableNFC() }
        ]
      );
      return;
    }

    navigation.navigate('CreatePayment');
  };

  const handleReceivePayment = () => {
    if (!state.nfcSupported) {
      Alert.alert(
        'NFC Not Supported',
        'This device does not support NFC functionality required for offline payments.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!state.nfcEnabled) {
      Alert.alert(
        'Enable NFC',
        'Please enable NFC in your device settings to receive payments.',
        [
          { text: 'Cancel' },
          { text: 'Settings', onPress: () => NFCService.promptEnableNFC() }
        ]
      );
      return;
    }

    navigation.navigate('Receive');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? Any pending transactions will be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          onPress: async () => {
            try {
              console.log('User initiated logout');
              await actions.logout();
              console.log('Logout complete - authentication state will update automatically');
            } catch (error) {
              console.error('Logout failed:', error);
              Alert.alert('Logout Error', 'Failed to logout properly. Please try again.');
            }
          }
        }
      ]
    );
  };

  const renderRecentTransaction = (transaction) => {
    const isOutgoing = transaction.type === 'send';
    
    return (
      <View key={transaction.id} style={styles.transactionItem}>
        <View style={styles.transactionIcon}>
          <Text style={styles.transactionIconText}>
            {isOutgoing ? '↗️' : '↙️'}
          </Text>
        </View>
        
        <View style={styles.transactionInfo}>
          <Text style={globalStyles.bodyText}>
            {isOutgoing ? 'Sent to' : 'Received from'} {transaction.recipient?.name || 'Unknown'}
          </Text>
          <Text style={globalStyles.mutedText}>
            {getRelativeTime(transaction.timestamp)}
          </Text>
        </View>
        
        <View style={styles.transactionAmount}>
          <Text style={[
            styles.transactionAmountText,
            { color: isOutgoing ? colors.warning : colors.success }
          ]}>
            {isOutgoing ? '-' : '+'}{formatSOL(transaction.amount)}
          </Text>
          <Text style={globalStyles.mutedText}>
            {transaction.status}
          </Text>
        </View>
      </View>
    );
  };

  const recentTransactions = [
    ...state.pendingTransactions,
    ...state.completedTransactions
  ]
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, 3);

  return (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={globalStyles.safeContainer}>
          {/* FLO Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.primary, letterSpacing: 2 }}>FLO</Text>
              <Text style={{ fontSize: 18, color: colors.textSecondary, marginLeft: 8 }}>
                {truncatePublicKey(state.user?.publicKey || state.wallet?.publicKey, 6)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutText}>🚪</Text>
            </TouchableOpacity>
          </View>

          {/* Wallet Balance - Blue Card */}
          <View style={[globalStyles.card, styles.balanceCard, { backgroundColor: colors.primary }]}> 
            <Text style={[globalStyles.captionText, { color: '#fff', opacity: 0.8 }]}>Balance</Text>
            <Text style={[styles.balanceAmount, { color: '#fff' }]}>
              {formatSOL(state.isOnline ? walletBalance : state.wallet?.balance || 0)}
            </Text>
            <Text style={[globalStyles.mutedText, { color: '#fff', opacity: 0.7 }]}> 
              {state.isOnline ? 'Live balance' : 'Last known balance'}
            </Text>
          </View>

          {/* Status Indicators */}
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <View style={[
                globalStyles.statusIndicator,
                state.isOnline ? globalStyles.statusOnline : globalStyles.statusOffline
              ]} />
              <Text style={globalStyles.captionText}>
                {state.isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
            
            <View style={styles.statusItem}>
              <View style={[
                globalStyles.statusIndicator,
                state.nfcEnabled ? globalStyles.statusOnline : globalStyles.statusOffline
              ]} />
              <Text style={globalStyles.captionText}>
                NFC {state.nfcEnabled ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
            
            <View style={styles.statusItem}>
              <View style={[
                globalStyles.statusIndicator,
                state.pendingTransactions.length > 0 ? globalStyles.statusPending : globalStyles.statusOnline
              ]} />
              <Text style={globalStyles.captionText}>
                {state.pendingTransactions.length} Pending
              </Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[globalStyles.button, styles.actionButton]}
              onPress={handleCreatePayment}
            >
              <Text style={styles.actionIcon}>💸</Text>
              <Text style={globalStyles.buttonText}>Send Payment</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[globalStyles.buttonSecondary, styles.actionButton]}
              onPress={handleReceivePayment}
            >
              <Text style={styles.actionIcon}>📱</Text>
              <Text style={globalStyles.buttonText}>Receive Payment</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[globalStyles.buttonOutline, styles.actionButton]}
              onPress={() => navigation.navigate('Sync')}
            >
              <Text style={styles.actionIcon}>🔄</Text>
              <Text style={globalStyles.buttonTextOutline}>Sync & History</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Transactions */}
          {recentTransactions.length > 0 && (
            <View style={styles.recentSection}>
              <View style={globalStyles.spaceBetween}>
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Sync')}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>

              <View style={[globalStyles.card, styles.transactionsCard]}>
                {recentTransactions.map(renderRecentTransaction)}
              </View>
            </View>
          )}

          {/* Feature Cards */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Features</Text>
            
            <View style={styles.featureGrid}>
              <View style={[globalStyles.card, styles.featureCard]}>
                <Text style={styles.featureIcon}>🔒</Text>
                <Text style={styles.featureTitle}>Secure</Text>
                <Text style={globalStyles.mutedText}>
                  Mobile wallet authentication
                </Text>
              </View>

              <View style={[globalStyles.card, styles.featureCard]}>
                <Text style={styles.featureIcon}>📱</Text>
                <Text style={styles.featureTitle}>NFC Transfer</Text>
                <Text style={globalStyles.mutedText}>
                  Offline peer-to-peer payments
                </Text>
              </View>

              <View style={[globalStyles.card, styles.featureCard]}>
                <Text style={styles.featureIcon}>⚡</Text>
                <Text style={styles.featureTitle}>Fast Sync</Text>
                <Text style={globalStyles.mutedText}>
                  Instant broadcasting when online
                </Text>
              </View>

              <View style={[globalStyles.card, styles.featureCard]}>
                <Text style={styles.featureIcon}>🌐</Text>
                <Text style={styles.featureTitle}>Solana Network</Text>
                <Text style={globalStyles.mutedText}>
                  Low fees, high throughput
                </Text>
              </View>
            </View>
          </View>

          {/* Demo Controls for testing */}
          <DemoControls />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = {
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    fontSize: 24,
  },
  balanceCard: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    marginBottom: 24,
    borderRadius: 24,
    padding: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    marginVertical: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionIcon: {
    fontSize: 20,
  },
  recentSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  viewAllText: {
    color: colors.accent,
    fontSize: 14,
  },
  transactionsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionIconText: {
    fontSize: 20,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: 16,
    fontWeight: '600',
  },
  featuresSection: {
    marginTop: 8,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
};

export default HomeScreen;