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
import { 
  formatSOL, 
  truncatePublicKey, 
  getRelativeTime,
  checkNetworkWithRetry 
} from '../utils/helpers';

const SyncScreen = ({ navigation }) => {
  const { state, actions } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [broadcasting, setBroadcasting] = useState(new Set());
  const [networkStatus, setNetworkStatus] = useState('checking');

  useEffect(() => {
    checkNetworkStatus();
  }, []);

  const checkNetworkStatus = async () => {
    try {
      setNetworkStatus('checking');
      const isOnline = await checkNetworkWithRetry();
      setNetworkStatus(isOnline ? 'online' : 'offline');
      actions.setOnlineStatus(isOnline);
    } catch (error) {
      console.error('Error checking network status:', error);
      setNetworkStatus('offline');
      actions.setOnlineStatus(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await checkNetworkStatus();
    setRefreshing(false);
  };

  const handleBroadcastTransaction = async (transaction) => {
    if (networkStatus !== 'online') {
      Alert.alert(
        'No Internet Connection',
        'Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Broadcast Transaction',
      `Broadcast transaction to Solana network?\n\nAmount: ${formatSOL(transaction.amount)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Broadcast', onPress: () => confirmBroadcast(transaction) }
      ]
    );
  };

  const confirmBroadcast = async (transaction) => {
    try {
      setBroadcasting(prev => new Set([...prev, transaction.id]));
      
      // Broadcast to Solana network
      const result = await SolanaService.broadcastTransaction({
        signedTransaction: transaction.signedTransaction,
      });

      if (result.success) {
        // Update transaction status
        actions.broadcastTransaction(transaction.id, result.signature);

        Alert.alert(
          'Transaction Successful',
          `Transaction has been broadcast to the Solana network.\n\nSignature: ${truncatePublicKey(result.signature, 6)}`,
          [
            { text: 'OK' },
            { 
              text: 'View Explorer', 
              onPress: () => {
                // In a real app, you would open the explorer URL
                Alert.alert('Explorer', result.explorerUrl);
              }
            }
          ]
        );
      } else {
        throw new Error('Broadcasting failed');
      }
    } catch (error) {
      console.error('Error broadcasting transaction:', error);
      Alert.alert(
        'Broadcast Failed',
        error.message || 'Unable to broadcast transaction to the network. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setBroadcasting(prev => {
        const newSet = new Set(prev);
        newSet.delete(transaction.id);
        return newSet;
      });
    }
  };

  const handleBroadcastAll = async () => {
    if (networkStatus !== 'online') {
      Alert.alert(
        'No Internet Connection',
        'Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    const pendingCount = state.pendingTransactions.length;
    if (pendingCount === 0) {
      Alert.alert(
        'No Pending Transactions',
        'There are no pending transactions to broadcast.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Broadcast All Transactions',
      `Broadcast all ${pendingCount} pending transactions to the Solana network?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Broadcast All', onPress: confirmBroadcastAll }
      ]
    );
  };

  const confirmBroadcastAll = async () => {
    try {
      const transactions = [...state.pendingTransactions];
      
      for (const transaction of transactions) {
        setBroadcasting(prev => new Set([...prev, transaction.id]));
        
        try {
          const result = await SolanaService.broadcastTransaction({
            signedTransaction: transaction.signedTransaction,
          });

          if (result.success) {
            actions.broadcastTransaction(transaction.id, result.signature);
          }
        } catch (error) {
          console.error(`Error broadcasting transaction ${transaction.id}:`, error);
        } finally {
          setBroadcasting(prev => {
            const newSet = new Set(prev);
            newSet.delete(transaction.id);
            return newSet;
          });
        }
      }

      Alert.alert(
        'Broadcast Complete',
        'All pending transactions have been processed.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error broadcasting all transactions:', error);
      Alert.alert(
        'Broadcast Error',
        'Some transactions may have failed to broadcast. Please check individual transactions.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderTransactionItem = (transaction, isPending = true) => {
    const isCurrentlyBroadcasting = broadcasting.has(transaction.id);
    
    return (
      <View key={transaction.id} style={[globalStyles.card, styles.transactionCard]}>
        <View style={styles.transactionHeader}>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionAmount}>
              {transaction.type === 'send' ? '-' : '+'}{formatSOL(transaction.amount)}
            </Text>
            <Text style={globalStyles.captionText}>
              {transaction.type === 'send' ? 'Sent to' : 'Received from'}{' '}
              {transaction.recipient?.name || 'Unknown'}
            </Text>
          </View>
          
          <View style={styles.transactionStatus}>
            <View style={[
              globalStyles.statusIndicator,
              isPending ? globalStyles.statusPending : globalStyles.statusOnline
            ]} />
            <Text style={globalStyles.captionText}>
              {isPending ? 'Pending' : 'Completed'}
            </Text>
          </View>
        </View>

        <View style={styles.transactionDetails}>
          <Text style={globalStyles.mutedText}>
            {truncatePublicKey(
              transaction.recipient?.address || transaction.metadata?.from
            )}
          </Text>
          <Text style={globalStyles.mutedText}>
            {getRelativeTime(transaction.timestamp)}
          </Text>
        </View>

        {transaction.memo && (
          <Text style={[globalStyles.captionText, styles.memo]}>
            {transaction.memo}
          </Text>
        )}

        {isPending && networkStatus === 'online' && (
          <TouchableOpacity
            style={[
              globalStyles.button,
              styles.broadcastButton,
              isCurrentlyBroadcasting && styles.buttonDisabled
            ]}
            onPress={() => handleBroadcastTransaction(transaction)}
            disabled={isCurrentlyBroadcasting}
          >
            <Text style={[globalStyles.buttonText, styles.broadcastButtonText]}>
              {isCurrentlyBroadcasting ? 'Broadcasting...' : 'Broadcast'}
            </Text>
          </TouchableOpacity>
        )}

        {!isPending && transaction.signature && (
          <TouchableOpacity
            style={styles.explorerButton}
            onPress={() => {
              Alert.alert(
                'Transaction Details',
                `Signature: ${transaction.signature}\n\nView on Solana Explorer?`,
                [
                  { text: 'Cancel' },
                  { text: 'View Explorer', onPress: () => {} }
                ]
              );
            }}
          >
            <Text style={styles.explorerButtonText}>View on Explorer</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={globalStyles.safeContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={globalStyles.title}>Sync & Transactions</Text>
          <View style={styles.networkStatus}>
            <View style={[
              globalStyles.statusIndicator,
              networkStatus === 'online' ? globalStyles.statusOnline : globalStyles.statusOffline
            ]} />
            <Text style={globalStyles.captionText}>
              {networkStatus === 'checking' ? 'Checking...' : 
               networkStatus === 'online' ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[globalStyles.card, styles.summaryCard]}>
            <Text style={styles.summaryNumber}>{state.pendingTransactions.length}</Text>
            <Text style={globalStyles.captionText}>Pending</Text>
          </View>
          <View style={[globalStyles.card, styles.summaryCard]}>
            <Text style={styles.summaryNumber}>{state.completedTransactions.length}</Text>
            <Text style={globalStyles.captionText}>Completed</Text>
          </View>
        </View>

        {/* Action Buttons */}
        {state.pendingTransactions.length > 0 && networkStatus === 'online' && (
          <TouchableOpacity
            style={[globalStyles.button, styles.broadcastAllButton]}
            onPress={handleBroadcastAll}
          >
            <Text style={globalStyles.buttonText}>
              Broadcast All Pending ({state.pendingTransactions.length})
            </Text>
          </TouchableOpacity>
        )}

        {/* Transactions List */}
        <ScrollView
          style={styles.transactionsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {/* Pending Transactions */}
          {state.pendingTransactions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pending Transactions</Text>
              {state.pendingTransactions.map(transaction => 
                renderTransactionItem(transaction, true)
              )}
            </View>
          )}

          {/* Completed Transactions */}
          {state.completedTransactions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Completed Transactions</Text>
              {state.completedTransactions.map(transaction => 
                renderTransactionItem(transaction, false)
              )}
            </View>
          )}

          {/* Empty State */}
          {state.pendingTransactions.length === 0 && state.completedTransactions.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📄</Text>
              <Text style={globalStyles.subtitle}>No Transactions</Text>
              <Text style={globalStyles.captionText}>
                Create a payment or receive one via NFC to get started
              </Text>
              <TouchableOpacity
                style={[globalStyles.button, styles.createButton]}
                onPress={() => navigation.navigate('CreatePayment')}
              >
                <Text style={globalStyles.buttonText}>Create Payment</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = {
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  networkStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  broadcastAllButton: {
    marginBottom: 16,
  },
  transactionsList: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  transactionCard: {
    marginBottom: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  transactionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  memo: {
    fontStyle: 'italic',
    marginBottom: 12,
  },
  broadcastButton: {
    backgroundColor: colors.success,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  broadcastButtonText: {
    fontSize: 14,
  },
  buttonDisabled: {
    backgroundColor: colors.surface,
    opacity: 0.5,
  },
  explorerButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  explorerButtonText: {
    color: colors.accent,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  createButton: {
    marginTop: 16,
    paddingHorizontal: 32,
  },
};

export default SyncScreen;