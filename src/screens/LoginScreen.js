import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../styles/globalStyles';
import { colors } from '../styles/theme';
import floLogo from '../assets/flo-logo';
import { useApp } from '../context/AppContext';
import SolanaService from '../services/SolanaService';

const LoginScreen = ({ navigation }) => {
  const { state, actions } = useApp();
  const [connecting, setConnecting] = useState(false);

  const handleConnectWallet = async () => {
    try {
      setConnecting(true);
      actions.setLoading(true);
      actions.clearError();

      console.log('Connecting wallet with REAL Mobile Wallet Adapter...');

      const result = await SolanaService.connectWallet();
      
      if (result.success) {
        const user = {
          id: 'user_' + Date.now(),
          email: `${result.walletName.toLowerCase()}@wallet.app`,
          publicKey: result.publicKey,
          walletName: result.walletName,
          authMethod: 'mobile_wallet_adapter'
        };

        const wallet = {
          publicKey: result.publicKey,
          balance: result.balance,
          connected: true,
          name: result.walletName,
          provider: 'mobile_wallet_adapter'
        };

        actions.loginSuccess(user, wallet);
        console.log(`Wallet connected: ${result.walletName}`);
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      actions.setError(error.message);
      
      Alert.alert(
        'Connection Failed',
        error.message,
        [{ text: 'OK' }]
      );
    } finally {
      setConnecting(false);
      actions.setLoading(false);
    }
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={globalStyles.centerContainer}>
        {/* Logo */}
        <View style={styles.header}>
          <Image source={floLogo} style={styles.logoImage} resizeMode="contain" />
          <Text style={styles.logo}>FLO</Text>
          <Text style={styles.subtitle}>Pay Offline on Solana Mobile</Text>
        </View>

        {/* Connect Wallet Button */}
        <TouchableOpacity
          style={[globalStyles.button, styles.connectButton]}
          onPress={handleConnectWallet}
          disabled={connecting}
        >
          {connecting ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.background} size="small" />
              <Text style={styles.loadingText}>Connecting...</Text>
            </View>
          ) : (
            <Text style={styles.connectText}>Connect Wallet</Text>
          )}
        </TouchableOpacity>

        {/* Error */}
        {state.error && (
          <View style={styles.errorContainer}>
            <Text style={globalStyles.errorText}>{state.error}</Text>
          </View>
        )}

        {/* Info */}
        <Text style={styles.infoText}>
          Connect your Solana wallet to start making payments
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = {
  header: {
    alignItems: 'center',
    marginBottom: 60,
    paddingHorizontal: 24,
  },
  logoImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  logo: {
    fontSize: 56,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 12,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  connectButton: {
    backgroundColor: colors.primary,
    paddingVertical: 20,
    width: '100%',
    maxWidth: 320,
    marginBottom: 24,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.background,
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600',
  },
  connectText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
    marginBottom: 24,
    width: '100%',
    maxWidth: 300,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
};

export default LoginScreen;