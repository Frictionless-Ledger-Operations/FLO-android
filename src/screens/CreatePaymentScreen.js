import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../styles/globalStyles';
import { colors } from '../styles/theme';
import { useApp } from '../context/AppContext';
import SolanaService from '../services/SolanaService';
import { 
  validateSOLAmount, 
  validateMemo, 
  formatSOL, 
  generateTransactionId,
  estimateTransactionFee 
} from '../utils/helpers';

const CreatePaymentScreen = ({ navigation }) => {
  const { state, actions } = useApp();
  const [amount, setAmount] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [memo, setMemo] = useState('');
  const [errors, setErrors] = useState({});
  const [creating, setCreating] = useState(false);

  const estimatedFee = estimateTransactionFee();
  const userBalance = state.wallet?.balance || 0;

  useEffect(() => {
    // Clear errors when inputs change
    if (errors.amount && amount) setErrors(prev => ({ ...prev, amount: null }));
    if (errors.recipientAddress && recipientAddress) setErrors(prev => ({ ...prev, recipientAddress: null }));
    if (errors.memo && memo) setErrors(prev => ({ ...prev, memo: null }));
  }, [amount, recipientAddress, memo]);

  const validateInputs = () => {
    const newErrors = {};

    // Validate amount
    const amountValidation = validateSOLAmount(amount);
    if (!amountValidation.valid) {
      newErrors.amount = amountValidation.error;
    } else if (amountValidation.amount + estimatedFee > userBalance) {
      newErrors.amount = 'Insufficient balance (including fees)';
    }

    // Validate recipient address
    if (!recipientAddress.trim()) {
      newErrors.recipientAddress = 'Recipient address is required';
    } else if (!SolanaService.isValidPublicKey(recipientAddress.trim())) {
      newErrors.recipientAddress = 'Invalid Solana address';
    }

    // Validate memo
    const memoValidation = validateMemo(memo);
    if (!memoValidation.valid) {
      newErrors.memo = memoValidation.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateTransaction = async () => {
    if (!validateInputs()) {
      return;
    }

    try {
      setCreating(true);
      actions.setLoading(true);

      // Create transaction data
      const transactionData = await SolanaService.createTransferTransaction(
        state.wallet.publicKey,
        recipientAddress.trim(),
        parseFloat(amount),
        memo.trim()
      );

      // Generate unique transaction ID
      const transactionId = generateTransactionId();

      // Create transaction object for state management
      const transaction = {
        id: transactionId,
        type: 'send',
        amount: parseFloat(amount),
        recipient: {
          name: recipientName.trim() || 'Unknown',
          address: recipientAddress.trim(),
        },
        memo: memo.trim(),
        fee: estimatedFee,
        transaction: transactionData.transaction,
        metadata: transactionData.metadata,
        status: 'created',
        timestamp: Date.now(),
      };

      // Store in app state
      actions.createTransaction(transaction);

      // Navigate to NFC send screen
      navigation.navigate('NFCSend');

    } catch (error) {
      console.error('Error creating transaction:', error);
      Alert.alert(
        'Transaction Creation Failed',
        error.message || 'Unable to create transaction. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setCreating(false);
      actions.setLoading(false);
    }
  };

  const handleScanQR = () => {
    // TODO: Implement QR code scanner for recipient address
    Alert.alert(
      'QR Scanner',
      'QR code scanner would open here to scan recipient address',
      [{ text: 'OK' }]
    );
  };

  const handleMaxAmount = () => {
    const maxAmount = Math.max(0, userBalance - estimatedFee);
    setAmount(maxAmount.toString());
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={globalStyles.safeContainer}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={globalStyles.title}>Create Payment</Text>
              <Text style={globalStyles.captionText}>
                Send SOL via NFC tap
              </Text>
            </View>

            {/* Balance Display */}
            <View style={[globalStyles.card, styles.balanceCard]}>
              <Text style={globalStyles.captionText}>Available Balance</Text>
              <Text style={styles.balanceAmount}>{formatSOL(userBalance)}</Text>
            </View>

            {/* Amount Input */}
            <View style={styles.inputGroup}>
              <Text style={globalStyles.label}>Amount (SOL)</Text>
              <View style={styles.amountContainer}>
                <TextInput
                  style={[
                    globalStyles.input,
                    styles.amountInput,
                    errors.amount && styles.inputError
                  ]}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.maxButton}
                  onPress={handleMaxAmount}
                >
                  <Text style={styles.maxButtonText}>MAX</Text>
                </TouchableOpacity>
              </View>
              {errors.amount && (
                <Text style={globalStyles.errorText}>{errors.amount}</Text>
              )}
            </View>

            {/* Recipient Name */}
            <View style={styles.inputGroup}>
              <Text style={globalStyles.label}>Recipient Name (Optional)</Text>
              <TextInput
                style={globalStyles.input}
                value={recipientName}
                onChangeText={setRecipientName}
                placeholder="Enter recipient name"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
              />
            </View>

            {/* Recipient Address */}
            <View style={styles.inputGroup}>
              <Text style={globalStyles.label}>Recipient Address</Text>
              <View style={styles.addressContainer}>
                <TextInput
                  style={[
                    globalStyles.input,
                    styles.addressInput,
                    errors.recipientAddress && styles.inputError
                  ]}
                  value={recipientAddress}
                  onChangeText={setRecipientAddress}
                  placeholder="Enter Solana address"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.qrButton}
                  onPress={handleScanQR}
                >
                  <Text style={styles.qrButtonText}>📷</Text>
                </TouchableOpacity>
              </View>
              {errors.recipientAddress && (
                <Text style={globalStyles.errorText}>{errors.recipientAddress}</Text>
              )}
            </View>

            {/* Memo */}
            <View style={styles.inputGroup}>
              <Text style={globalStyles.label}>Memo (Optional)</Text>
              <TextInput
                style={[
                  globalStyles.input,
                  styles.memoInput,
                  errors.memo && styles.inputError
                ]}
                value={memo}
                onChangeText={setMemo}
                placeholder="Add a note"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                maxLength={100}
              />
              <Text style={styles.characterCount}>{memo.length}/100</Text>
              {errors.memo && (
                <Text style={globalStyles.errorText}>{errors.memo}</Text>
              )}
            </View>

            {/* Transaction Summary */}
            {amount && parseFloat(amount) > 0 && (
              <View style={[globalStyles.card, styles.summaryCard]}>
                <Text style={styles.summaryTitle}>Transaction Summary</Text>
                <View style={globalStyles.spaceBetween}>
                  <Text style={globalStyles.bodyText}>Amount:</Text>
                  <Text style={globalStyles.bodyText}>{formatSOL(parseFloat(amount))}</Text>
                </View>
                <View style={globalStyles.spaceBetween}>
                  <Text style={globalStyles.bodyText}>Network Fee:</Text>
                  <Text style={globalStyles.bodyText}>{formatSOL(estimatedFee)}</Text>
                </View>
                <View style={globalStyles.divider} />
                <View style={globalStyles.spaceBetween}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalAmount}>
                    {formatSOL(parseFloat(amount) + estimatedFee)}
                  </Text>
                </View>
              </View>
            )}

            {/* Create Transaction Button */}
            <TouchableOpacity
              style={[
                globalStyles.button,
                (!amount || creating) && styles.buttonDisabled
              ]}
              onPress={handleCreateTransaction}
              disabled={!amount || creating}
            >
              <Text style={globalStyles.buttonText}>
                {creating ? 'Creating...' : 'Create Transaction'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  balanceCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginBottom: 24,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountInput: {
    flex: 1,
    marginRight: 12,
  },
  maxButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  maxButtonText: {
    color: colors.background,
    fontWeight: '600',
    fontSize: 14,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressInput: {
    flex: 1,
    marginRight: 12,
  },
  qrButton: {
    backgroundColor: colors.surface,
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  qrButtonText: {
    fontSize: 20,
  },
  memoInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  characterCount: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },
  inputError: {
    borderColor: colors.error,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  buttonDisabled: {
    backgroundColor: colors.surface,
    opacity: 0.5,
  },
};

export default CreatePaymentScreen;