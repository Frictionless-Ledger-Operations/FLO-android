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
import { formatSOL, truncatePublicKey } from '../utils/helpers';

const ReceiveScreen = ({ navigation }) => {
  const { actions } = useApp();
  const [listeningStatus, setListeningStatus] = useState('checking'); // checking, ready, listening, received, error
  const [receivedData, setReceivedData] = useState(null);
  const [nfcError, setNfcError] = useState(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initializeNFC();
    
    // Handle back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    
    return () => {
      backHandler.remove();
      stopListening();
    };
  }, []);

  useEffect(() => {
    if (listeningStatus === 'listening') {
      startAnimations();
    } else {
      stopAnimations();
    }
  }, [listeningStatus]);

  const initializeNFC = async () => {
    try {
      const nfcResult = await NFCService.initialize();
      
      if (!nfcResult.supported) {
        setListeningStatus('error');
        setNfcError('NFC not supported on this device');
        Alert.alert(
          'NFC Not Supported',
          'This device does not support NFC functionality.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }

      if (!nfcResult.enabled) {
        setListeningStatus('error');
        setNfcError('NFC is disabled');
        Alert.alert(
          'Enable NFC',
          'Please enable NFC in your device settings to receive payments.',
          [
            { text: 'Cancel', onPress: () => navigation.goBack() },
            { text: 'Settings', onPress: () => NFCService.promptEnableNFC() }
          ]
        );
        return;
      }

      setListeningStatus('ready');
    } catch (error) {
      console.error('NFC initialization failed:', error);
      setListeningStatus('error');
      setNfcError(error.message);
    }
  };

  const startListening = async () => {
    try {
      setListeningStatus('listening');
      setNfcError(null);

      await NFCService.listenForTransaction(
        handleTransactionReceived,
        handleNFCError
      );
    } catch (error) {
      console.error('Failed to start NFC listening:', error);
      setListeningStatus('error');
      setNfcError(error.message);
      
      Alert.alert(
        'Listening Failed',
        'Unable to start listening for NFC payments. Please try again.',
        [
          { text: 'Retry', onPress: () => setListeningStatus('ready') },
          { text: 'Cancel', onPress: () => navigation.goBack() }
        ]
      );
    }
  };

  const stopListening = async () => {
    try {
      await NFCService.stopListening();
    } catch (error) {
      console.error('Error stopping NFC listener:', error);
    }
  };

  const handleTransactionReceived = (transactionData) => {
    try {
      console.log('Transaction received:', transactionData);
      
      setReceivedData(transactionData);
      setListeningStatus('received');
      
      // Store received transaction in app state
      actions.receiveTransaction({
        ...transactionData,
        receivedAt: Date.now(),
        status: 'received',
      });

      // Show success feedback
      Alert.alert(
        'Payment Received!',
        'A payment has been received via NFC. Would you like to review and finalize it?',
        [
          { text: 'Later', onPress: () => navigation.navigate('Home') },
          { text: 'Review', onPress: () => navigation.navigate('Finalize') }
        ]
      );
    } catch (error) {
      console.error('Error handling received transaction:', error);
      handleNFCError(new Error('Failed to process received payment'));
    }
  };

  const handleNFCError = (error) => {
    console.error('NFC Error:', error);
    setListeningStatus('error');
    setNfcError(error.message);
  };

  const startAnimations = () => {
    // Pulse animation
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (listeningStatus === 'listening') {
          pulse();
        }
      });
    };

    // Glow animation
    const glow = () => {
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ]).start(() => {
        if (listeningStatus === 'listening') {
          glow();
        }
      });
    };

    pulse();
    glow();
  };

  const stopAnimations = () => {
    pulseAnim.stopAnimation();
    glowAnim.stopAnimation();
    
    Animated.parallel([
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handleBackPress = () => {
    if (listeningStatus === 'listening') {
      Alert.alert(
        'Stop Listening',
        'Are you sure you want to stop listening for payments?',
        [
          { text: 'No', style: 'cancel' },
          { 
            text: 'Yes', 
            onPress: async () => {
              await stopListening();
              navigation.goBack();
            }
          }
        ]
      );
      return true;
    }
    return false;
  };

  const getStatusIcon = () => {
    switch (listeningStatus) {
      case 'checking': return '🔍';
      case 'ready': return '📱';
      case 'listening': return '👂';
      case 'received': return '✅';
      case 'error': return '❌';
      default: return '📱';
    }
  };

  const getStatusText = () => {
    switch (listeningStatus) {
      case 'checking': return 'Checking NFC...';
      case 'ready': return 'Ready to receive';
      case 'listening': return 'Listening for payment...';
      case 'received': return 'Payment received!';
      case 'error': return 'Error occurred';
      default: return 'Preparing...';
    }
  };

  const getInstructions = () => {
    switch (listeningStatus) {
      case 'ready':
        return 'Tap "Start Listening" to begin receiving payments via NFC';
      case 'listening':
        return 'Bring the sender\'s device close to your device to receive the payment';
      case 'received':
        return 'Payment successfully received and ready for finalization';
      case 'error':
        return nfcError || 'Something went wrong with NFC';
      default:
        return 'Checking NFC availability...';
    }
  };

  const animatedGlow = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.surface, colors.nfcWaiting],
  });

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={globalStyles.safeContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={globalStyles.title}>Receive Payment</Text>
          <Text style={globalStyles.captionText}>
            {getStatusText()}
          </Text>
        </View>

        {/* Received Transaction Details */}
        {receivedData && (
          <View style={[globalStyles.card, styles.receivedCard]}>
            <Text style={styles.receivedTitle}>Payment Received</Text>
            <View style={globalStyles.spaceBetween}>
              <Text style={globalStyles.captionText}>Amount</Text>
              <Text style={styles.amount}>
                {formatSOL(receivedData.metadata?.amount || 0)}
              </Text>
            </View>
            <View style={globalStyles.spaceBetween}>
              <Text style={globalStyles.captionText}>From</Text>
              <Text style={globalStyles.bodyText}>
                {truncatePublicKey(receivedData.metadata?.from)}
              </Text>
            </View>
            {receivedData.metadata?.memo && (
              <View style={globalStyles.spaceBetween}>
                <Text style={globalStyles.captionText}>Memo</Text>
                <Text style={globalStyles.bodyText}>{receivedData.metadata.memo}</Text>
              </View>
            )}
          </View>
        )}

        {/* NFC Listening Area */}
        <View style={styles.nfcContainer}>
          <TouchableOpacity
            style={[
              styles.nfcArea,
              listeningStatus === 'listening' && styles.nfcAreaListening,
              listeningStatus === 'received' && styles.nfcAreaReceived,
              listeningStatus === 'error' && styles.nfcAreaError,
            ]}
            onPress={listeningStatus === 'ready' ? startListening : null}
            disabled={listeningStatus !== 'ready'}
            activeOpacity={0.8}
          >
            <Animated.View 
              style={[
                globalStyles.nfcPulse,
                { 
                  transform: [{ scale: pulseAnim }],
                  backgroundColor: listeningStatus === 'listening' ? animatedGlow : colors.nfcActive,
                }
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
          {listeningStatus === 'ready' && (
            <TouchableOpacity
              style={globalStyles.button}
              onPress={startListening}
            >
              <Text style={globalStyles.buttonText}>Start Listening</Text>
            </TouchableOpacity>
          )}

          {listeningStatus === 'listening' && (
            <TouchableOpacity
              style={globalStyles.buttonOutline}
              onPress={async () => {
                await stopListening();
                setListeningStatus('ready');
              }}
            >
              <Text style={globalStyles.buttonTextOutline}>Stop Listening</Text>
            </TouchableOpacity>
          )}

          {listeningStatus === 'received' && (
            <>
              <TouchableOpacity
                style={globalStyles.button}
                onPress={() => navigation.navigate('Finalize')}
              >
                <Text style={globalStyles.buttonText}>Review & Finalize</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={globalStyles.buttonOutline}
                onPress={() => navigation.navigate('Home')}
              >
                <Text style={globalStyles.buttonTextOutline}>Save for Later</Text>
              </TouchableOpacity>
            </>
          )}

          {listeningStatus === 'error' && (
            <>
              <TouchableOpacity
                style={globalStyles.button}
                onPress={() => {
                  setListeningStatus('checking');
                  setNfcError(null);
                  initializeNFC();
                }}
              >
                <Text style={globalStyles.buttonText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={globalStyles.buttonOutline}
                onPress={() => navigation.goBack()}
              >
                <Text style={globalStyles.buttonTextOutline}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}

          {!['listening', 'error'].includes(listeningStatus) && (
            <TouchableOpacity
              style={globalStyles.buttonOutline}
              onPress={() => navigation.goBack()}
            >
              <Text style={globalStyles.buttonTextOutline}>Back</Text>
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
  receivedCard: {
    backgroundColor: colors.success + '20',
    borderColor: colors.success,
    borderWidth: 1,
    marginBottom: 24,
  },
  receivedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.success,
    marginBottom: 12,
  },
  amount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  nfcContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginVertical: 32,
  },
  nfcArea: {
    width: 220,
    height: 220,
    borderRadius: 110,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.border,
    marginBottom: 24,
  },
  nfcAreaListening: {
    borderColor: colors.nfcWaiting,
    backgroundColor: colors.surface,
  },
  nfcAreaReceived: {
    borderColor: colors.success,
  },
  nfcAreaError: {
    borderColor: colors.error,
  },
  nfcIconText: {
    fontSize: 36,
  },
  instructionText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 24,
  },
  buttonContainer: {
    gap: 12,
  },
};

export default ReceiveScreen;