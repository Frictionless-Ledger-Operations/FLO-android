import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { globalStyles } from '../styles/globalStyles';
import { colors } from '../styles/theme';
import { useApp } from '../context/AppContext';
import NFCService from '../services/NFCService';

const DemoControls = () => {
  const { state } = useApp();

  const simulateNFCTransfer = () => {
    if (!state.currentTransaction) {
      Alert.alert(
        'No Transaction',
        'Create a payment first to simulate NFC transfer',
        [{ text: 'OK' }]
      );
      return;
    }

    // Simulate receiving the current transaction
    const mockReceivedData = {
      id: state.currentTransaction.id,
      signedTransaction: 'mock_signed_' + Date.now(),
      nonce: 'demo_nonce_123',
      metadata: {
        ...state.currentTransaction.metadata,
        amount: state.currentTransaction.amount,
        recipient: state.currentTransaction.recipient,
        memo: state.currentTransaction.memo,
        fee: state.currentTransaction.fee || 0.000005,
        timestamp: state.currentTransaction.timestamp,
      },
    };

    // Simulate NFC reception
    NFCService.simulateReceiveTransaction(mockReceivedData);
    
    Alert.alert(
      'Demo NFC Transfer',
      'Simulated NFC transfer completed! Check the Receive screen.',
      [{ text: 'OK' }]
    );
  };

  const showDemoInfo = () => {
    Alert.alert(
      'Demo Mode Info',
      'This app is running in demo mode for Expo Go compatibility.\n\n' +
      '• Wallet operations are mocked\n' +
      '• NFC transfers are simulated\n' +
      '• All UI flows are functional\n\n' +
      'For full functionality with real NFC and wallet, build a development build.',
      [{ text: 'OK' }]
    );
  };

  if (__DEV__) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🔧 Demo Controls</Text>
        
        <TouchableOpacity
          style={[globalStyles.buttonOutline, styles.button]}
          onPress={simulateNFCTransfer}
        >
          <Text style={globalStyles.buttonTextOutline}>
            📱 Simulate NFC Transfer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[globalStyles.buttonOutline, styles.button]}
          onPress={showDemoInfo}
        >
          <Text style={globalStyles.buttonTextOutline}>
            ℹ️ Demo Info
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
};

const styles = {
  container: {
    backgroundColor: colors.surface,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    marginVertical: 4,
    paddingVertical: 8,
  },
};

export default DemoControls;