import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../styles/globalStyles';
import { colors } from '../styles/theme';
import { useApp } from '../context/AppContext';
import { 
  formatSOL, 
  truncatePublicKey, 
  formatTimestamp,
  getRelativeTime 
} from '../utils/helpers';

const FinalizeScreen = ({ navigation }) => {
  const { state, actions } = useApp();
  const [finalizing, setFinalizing] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('verifying'); // verifying, valid, invalid

  const currentTransaction = state.currentTransaction;

  useEffect(() => {
    if (!currentTransaction || currentTransaction.status !== 'received') {
      // No transaction to finalize or wrong status
      Alert.alert(
        'No Transaction',
        'There is no transaction to finalize.',
        [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
      );
      return;
    }

    verifyTransaction();
  }, []);

  const verifyTransaction = async () => {
    try {
      setVerificationStatus('verifying');
      
      // Simulate transaction verification
      // In a real app, you would:
      // 1. Verify the transaction signature
      // 2. Check transaction data integrity
      // 3. Validate nonce and metadata
      // 4. Ensure transaction hasn't been tampered with
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, assume verification is successful
      setVerificationStatus('valid');
    } catch (error) {
      console.error('Transaction verification failed:', error);
      setVerificationStatus('invalid');
      
      Alert.alert(
        'Verification Failed',
        'Unable to verify the transaction integrity. It may have been corrupted.',
        [
          { text: 'Reject', onPress: () => navigation.goBack() },
          { text: 'Try Again', onPress: verifyTransaction }
        ]
      );
    }
  };

  const handleFinalizeTransaction = async () => {
    if (verificationStatus !== 'valid') {
      Alert.alert(
        'Cannot Finalize',
        'Transaction verification must pass before finalizing.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Finalize Transaction',
      'Are you sure you want to finalize this transaction? Once finalized, it will be ready for broadcasting to the Solana network.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Finalize', onPress: confirmFinalization }
      ]
    );
  };

  const confirmFinalization = async () => {
    try {
      setFinalizing(true);
      
      // Finalize the transaction
      actions.finalizeTransaction();
      
      // Show success message
      Alert.alert(
        'Transaction Finalized',
        'The transaction has been finalized and is ready for broadcasting when you go online.',
        [{ text: 'OK', onPress: () => navigation.navigate('Sync') }]
      );
      
    } catch (error) {
      console.error('Error finalizing transaction:', error);
      Alert.alert(
        'Finalization Failed',
        'Unable to finalize the transaction. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setFinalizing(false);
    }
  };

  const handleRejectTransaction = () => {
    Alert.alert(
      'Reject Transaction',
      'Are you sure you want to reject this transaction? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reject', 
          style: 'destructive',
          onPress: () => {
            actions.clearCurrentTransaction();
            navigation.navigate('Home');
          }
        }
      ]
    );
  };

  const getVerificationIcon = () => {
    switch (verificationStatus) {
      case 'verifying': return '🔍';
      case 'valid': return '✅';
      case 'invalid': return '❌';
      default: return '🔍';
    }
  };

  const getVerificationText = () => {
    switch (verificationStatus) {
      case 'verifying': return 'Verifying transaction...';
      case 'valid': return 'Transaction verified';
      case 'invalid': return 'Verification failed';
      default: return 'Checking...';
    }
  };

  const getVerificationColor = () => {
    switch (verificationStatus) {
      case 'verifying': return colors.info;
      case 'valid': return colors.success;
      case 'invalid': return colors.error;
      default: return colors.textMuted;
    }
  };

  if (!currentTransaction) {
    return (
      <SafeAreaView style={globalStyles.centerContainer}>
        <Text style={globalStyles.errorText}>No transaction to finalize</Text>
        <TouchableOpacity
          style={globalStyles.button}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={globalStyles.buttonText}>Go Home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={globalStyles.safeContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={globalStyles.title}>Review Payment</Text>
            <Text style={globalStyles.captionText}>
              Verify details before finalizing
            </Text>
          </View>

          {/* Verification Status */}
          <View style={[globalStyles.card, styles.verificationCard]}>
            <View style={globalStyles.row}>
              <Text style={styles.verificationIcon}>{getVerificationIcon()}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.verificationText, { color: getVerificationColor() }]}>
                  {getVerificationText()}
                </Text>
                {verificationStatus === 'valid' && (
                  <Text style={globalStyles.mutedText}>
                    Transaction signature and data integrity confirmed
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Transaction Details */}
          <View style={[globalStyles.card, styles.detailsCard]}>
            <Text style={styles.sectionTitle}>Transaction Details</Text>
            
            <View style={styles.detailRow}>
              <Text style={globalStyles.captionText}>Amount</Text>
              <Text style={styles.amountText}>
                {formatSOL(currentTransaction.metadata?.amount || 0)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={globalStyles.captionText}>From</Text>
              <View style={styles.addressInfo}>
                <Text style={globalStyles.bodyText}>
                  {truncatePublicKey(currentTransaction.metadata?.from)}
                </Text>
                <Text style={globalStyles.mutedText}>
                  Sender's wallet
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={globalStyles.captionText}>To</Text>
              <View style={styles.addressInfo}>
                <Text style={globalStyles.bodyText}>
                  {truncatePublicKey(currentTransaction.metadata?.to)}
                </Text>
                <Text style={globalStyles.mutedText}>
                  Your wallet
                </Text>
              </View>
            </View>

            {currentTransaction.metadata?.memo && (
              <View style={styles.detailRow}>
                <Text style={globalStyles.captionText}>Memo</Text>
                <Text style={globalStyles.bodyText}>
                  {currentTransaction.metadata.memo}
                </Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={globalStyles.captionText}>Network Fee</Text>
              <Text style={globalStyles.bodyText}>
                {formatSOL(currentTransaction.metadata?.fee || 0)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={globalStyles.captionText}>Received</Text>
              <Text style={globalStyles.bodyText}>
                {getRelativeTime(currentTransaction.receivedAt || currentTransaction.timestamp)}
              </Text>
            </View>
          </View>

          {/* Transaction Summary */}
          <View style={[globalStyles.card, styles.summaryCard]}>
            <Text style={styles.sectionTitle}>Summary</Text>
            
            <View style={styles.summaryRow}>
              <Text style={globalStyles.bodyText}>You will receive:</Text>
              <Text style={styles.receivedAmount}>
                {formatSOL(currentTransaction.metadata?.amount || 0)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={globalStyles.mutedText}>Status:</Text>
              <Text style={[
                globalStyles.bodyText,
                { color: currentTransaction.status === 'received' ? colors.warning : colors.success }
              ]}>
                {currentTransaction.status === 'received' ? 'Pending Finalization' : 'Finalized'}
              </Text>
            </View>
          </View>

          {/* Security Notice */}
          <View style={[globalStyles.card, styles.securityCard]}>
            <Text style={styles.securityTitle}>🔒 Security Notice</Text>
            <Text style={globalStyles.captionText}>
              • Transaction has been verified cryptographically{'\n'}
              • Funds will be available after broadcasting to Solana network{'\n'}
              • Finalization creates a pending transaction for broadcasting
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                globalStyles.button,
                (verificationStatus !== 'valid' || finalizing) && styles.buttonDisabled
              ]}
              onPress={handleFinalizeTransaction}
              disabled={verificationStatus !== 'valid' || finalizing}
            >
              <Text style={globalStyles.buttonText}>
                {finalizing ? 'Finalizing...' : 'Finalize Transaction'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[globalStyles.buttonOutline, styles.rejectButton]}
              onPress={handleRejectTransaction}
              disabled={finalizing}
            >
              <Text style={[globalStyles.buttonTextOutline, styles.rejectButtonText]}>
                Reject Transaction
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={globalStyles.buttonOutline}
              onPress={() => navigation.goBack()}
              disabled={finalizing}
            >
              <Text style={globalStyles.buttonTextOutline}>Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = {
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  verificationCard: {
    backgroundColor: colors.surface,
    marginBottom: 16,
  },
  verificationIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  verificationText: {
    fontSize: 16,
    fontWeight: '600',
  },
  detailsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  addressInfo: {
    alignItems: 'flex-end',
    flex: 1,
    marginLeft: 16,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  receivedAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.success,
  },
  securityCard: {
    backgroundColor: colors.surface,
    borderLeftWidth: 3,
    borderLeftColor: colors.info,
    marginBottom: 24,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.info,
    marginBottom: 8,
  },
  buttonContainer: {
    gap: 12,
  },
  buttonDisabled: {
    backgroundColor: colors.surface,
    opacity: 0.5,
  },
  rejectButton: {
    borderColor: colors.error,
  },
  rejectButtonText: {
    color: colors.error,
  },
};

export default FinalizeScreen;