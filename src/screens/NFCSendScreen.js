import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Alert,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../styles/globalStyles';
import { colors } from '../styles/theme';
import { useApp } from '../context/AppContext';
import NFCService from '../services/NFCService';
import SolanaService from '../services/SolanaService';
import { formatSOL, truncatePublicKey } from '../utils/helpers';

const NFCSendScreen = ({ navigation }) => {
  const { state, actions } = useApp();
  const [nfcStatus, setNfcStatus] = useState('checking');
  const [transferStatus, setTransferStatus] = useState('preparing'); // preparing, ready, sending, success, error
  const [signedTransaction, setSignedTransaction] = useState(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [transferError, setTransferError] = useState(null);

  const currentTransaction = state.currentTransaction;

  useEffect(() => {
    initializeNFC();
    signTransaction();
    
    // Handle back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    
    return () => {
      backHandler.remove();
      NFCService.cleanup();
    };
  }, []);

  useEffect(() => {
    if (transferStatus === 'ready') {
      startPulseAnimation();
    } else {
      stopPulseAnimation();
    }
  }, [transferStatus]);

  const initializeNFC = async () => {
    try {
      const nfcResult = await NFCService.initialize();
      
      if (!nfcResult.supported) {
        setNfcStatus('unsupported');
        Alert.alert(
          'NFC Not Supported',
          'This device does not support NFC functionality.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }

      if (!nfcResult.enabled) {
        setNfcStatus('disabled');
        Alert.alert(
          'Enable NFC',
          'Please enable NFC in your device settings to continue.',
          [
            { text: 'Cancel', onPress: () => navigation.goBack() },
            { text: 'Settings', onPress: () => NFCService.promptEnableNFC() }
          ]
        );
        return;
      }

      setNfcStatus('enabled');
    } catch (error) {
      console.error('NFC initialization failed:', error);
      setNfcStatus('error');
      setTransferError(error.message);
    }
  };

  const signTransaction = async () => {
    try {
      if (!currentTransaction) {
        throw new Error('No transaction to sign');
      }

      setTransferStatus('preparing');

      // Check if wallet is connected and has required properties
      if (!state.wallet || !state.wallet.connected || !state.wallet.name || !state.wallet.provider || !state.wallet.publicKey) {
        throw new Error('Wallet not connected or missing required wallet info');
      }

      // Debug logs for wallet and transaction context
      console.log('--- DEBUG: Wallet Info ---');
      console.log('Wallet Name:', state.wallet.name);
      console.log('Wallet Provider:', state.wallet.provider);
      console.log('Wallet Public Key:', state.wallet.publicKey);
      console.log('Wallet Connected:', state.wallet.connected);
      if (state.wallet.network) {
        console.log('Wallet Network:', state.wallet.network);
      }
      console.log('--- DEBUG: Transaction Info ---');
      console.log('Transaction:', currentTransaction);

      console.log(`Signing transaction with ${state.wallet.name}...`);

      // Sign the transaction using Mobile Wallet Adapter
      const signResult = await SolanaService.signTransaction(currentTransaction);

      if (!signResult || !signResult.signedTransaction) {
        throw new Error('Signing result is invalid');
      }

      setSignedTransaction(signResult);
      actions.signTransaction(signResult);

      // Update status to ready for NFC transfer
      setTransferStatus('ready');
    } catch (error) {
      console.error('Transaction signing failed:', error);
      setTransferStatus('error');
      setTransferError(error.message);

      Alert.alert(
        'Signing Failed',
        error.message || 'Unable to sign transaction with wallet. Please try again.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };

  const startPulseAnimation = () => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
      ]).start(() => {
        if (transferStatus === 'ready') {
          pulse();
        }
      });
    };
    pulse();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleNFCTransfer = async () => {
    if (!signedTransaction || transferStatus !== 'ready') {
      return;
    }

    try {
      setTransferStatus('sending');

      // Initialize NFC and prepare transfer data
      await NFCService.initialize();
      await NFCService.requestTechnology();

      // Prepare transfer data with wallet signature
      const transferData = {
        id: currentTransaction.id,
        signedTransaction: signedTransaction.signedTransaction,
        zkSignature: signedTransaction.zkSignature,
        nonce: signedTransaction.nonce,
        metadata: {
          ...currentTransaction.metadata,
          amount: currentTransaction.amount,
          recipient: currentTransaction.recipient,
          memo: currentTransaction.memo,
          fee: currentTransaction.fee,
          timestamp: currentTransaction.timestamp,
          wallet: {
            name: state.wallet.name,
            provider: state.wallet.provider,
            publicKey: state.wallet.publicKey
          }
        },
      };

      // Initialize NFC before sending
      await NFCService.initialize();
      
      // Request NFC technology
      await NFCService.requestTechnology();
      
      // Send data via NFC
      const result = await NFCService.sendTransactionData(transferData);
      
      if (result.success) {
        setTransferStatus('success');
        
        // Show success message and navigate
        Alert.alert(
          'Transfer Successful',
          `Transaction has been sent via NFC signed by ${state.wallet.name}. The receiver can now finalize it.`,
          [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
        );
      } else {
        throw new Error('Failed to send data via NFC');
      }
    } catch (error) {
      console.error('NFC transfer failed:', error);
      setTransferStatus('error');
      setTransferError(error.message);
      
      Alert.alert(
        'Transfer Failed',
        'Unable to send transaction via NFC. Please try again.',
        [
          { text: 'Retry', onPress: () => setTransferStatus('ready') },
          { text: 'Cancel', onPress: () => navigation.goBack() }
        ]
      );
    }
  };

  const handleBackPress = () => {
    if (transferStatus === 'sending') {
      // Don't allow back during transfer
      return true;
    }
    
    Alert.alert(
      'Cancel Transfer',
      'Are you sure you want to cancel this transaction?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          onPress: () => {
            actions.clearCurrentTransaction();
            navigation.goBack();
          }
        }
      ]
    );
    return true;
  };

  const getStatusIcon = () => {
    switch (transferStatus) {
      case 'preparing': return 'PREP';
      case 'ready': return 'NFC';
      case 'sending': return 'SEND';
      case 'success': return 'OK';
      case 'error': return 'ERR';
      default: return 'NFC';
    }
  };

  const getStatusText = () => {
    switch (transferStatus) {
              case 'preparing': return 'Signing with wallet...';
      case 'ready': return 'Ready to transfer';
      case 'sending': return 'Sending via NFC...';
      case 'success': return 'Transfer complete!';
      case 'error': return 'Transfer failed';
      default: return 'Preparing...';
    }
  };

  const getInstructions = () => {
    switch (transferStatus) {
      case 'preparing':
        return 'Generating wallet signature...';
      case 'ready':
        return 'Tap the NFC area below and bring your device close to the receiver\'s device';
      case 'sending':
        return 'Keep devices close together until transfer completes';
      case 'success':
        return 'Transaction successfully sent to receiver';
      case 'error':
        return transferError || 'Something went wrong';
      default:
        return 'Setting up secure transaction...';
    }
  };

  if (!currentTransaction) {
    return (
      <SafeAreaView style={globalStyles.centerContainer}>
        <Text style={globalStyles.errorText}>No transaction found</Text>
        <TouchableOpacity
          style={globalStyles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={globalStyles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={globalStyles.safeContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={globalStyles.title}>Send Payment</Text>
          <Text style={globalStyles.captionText}>
            {getStatusText()}
          </Text>
          {transferStatus === 'preparing' && (
            <Text style={styles.walletStatus}>
              🔐 Secured by Mobile Wallet
            </Text>
          )}
        </View>

        {/* Transaction Details */}
        <View style={[globalStyles.card, styles.transactionCard]}>
          <View style={globalStyles.spaceBetween}>
            <Text style={globalStyles.captionText}>Amount</Text>
            <Text style={styles.amount}>{formatSOL(currentTransaction.amount)}</Text>
          </View>
          <View style={globalStyles.spaceBetween}>
            <Text style={globalStyles.captionText}>To</Text>
            <View style={styles.recipientInfo}>
              <Text style={globalStyles.bodyText}>{currentTransaction.recipient.name}</Text>
              <Text style={globalStyles.mutedText}>
                {truncatePublicKey(currentTransaction.recipient.address)}
              </Text>
            </View>
          </View>
          {currentTransaction.memo && (
            <View style={globalStyles.spaceBetween}>
              <Text style={globalStyles.captionText}>Memo</Text>
              <Text style={globalStyles.bodyText}>{currentTransaction.memo}</Text>
            </View>
          )}
          <View style={globalStyles.spaceBetween}>
            <Text style={globalStyles.captionText}>Signature Type</Text>
            <Text style={styles.signatureType}>Mobile Wallet</Text>
          </View>
        </View>

        {/* NFC Transfer Area */}
        <View style={styles.nfcContainer}>
          <TouchableOpacity
            style={[
              styles.nfcArea,
              transferStatus === 'ready' && styles.nfcAreaActive,
              transferStatus === 'error' && styles.nfcAreaError,
              transferStatus === 'success' && styles.nfcAreaSuccess,
            ]}
            onPress={handleNFCTransfer}
            disabled={transferStatus !== 'ready'}
            activeOpacity={0.8}
          >
            <Animated.View 
              style={[
                globalStyles.nfcPulse,
                { transform: [{ scale: pulseAnim }] }
              ]}
            >
              <View style={globalStyles.nfcIcon}>
                <Text style={styles.nfcIconText}>{getStatusIcon()}</Text>
              </View>
            </Animated.View>
          </TouchableOpacity>

          <Text style={styles.instructionText}>
            {getInstructions()}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {transferStatus === 'ready' && (
            <TouchableOpacity
              style={globalStyles.button}
              onPress={handleNFCTransfer}
            >
              <Text style={globalStyles.buttonText}>Start NFC Transfer</Text>
            </TouchableOpacity>
          )}

          {transferStatus === 'error' && (
            <TouchableOpacity
              style={globalStyles.button}
              onPress={() => {
                setTransferStatus('preparing');
                setTransferError(null);
                signTransaction();
              }}
            >
              <Text style={globalStyles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          )}

          {transferStatus !== 'sending' && (
            <TouchableOpacity
              style={globalStyles.buttonOutline}
              onPress={handleBackPress}
            >
              <Text style={globalStyles.buttonTextOutline}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = {
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  walletStatus: {
    fontSize: 12,
    color: colors.secondary,
    marginTop: 4,
    fontWeight: '500',
  },
  transactionCard: {
    marginBottom: 32,
  },
  amount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  recipientInfo: {
    alignItems: 'flex-end',
  },
  signatureType: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '600',
  },
  nfcContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginVertical: 32,
  },
  nfcArea: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.border,
    marginBottom: 24,
  },
  nfcAreaActive: {
    borderColor: colors.nfcActive,
    backgroundColor: colors.surface,
  },
  nfcAreaError: {
    borderColor: colors.error,
  },
  nfcAreaSuccess: {
    borderColor: colors.success,
  },
  nfcIconText: {
    fontSize: 32,
  },
  instructionText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 32,
  },
  buttonContainer: {
    gap: 12,
  },
};

export default NFCSendScreen;