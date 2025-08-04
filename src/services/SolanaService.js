import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
} from '@solana/web3.js';
import { Buffer } from 'buffer';

// REAL Solana Mobile Wallet Adapter - NO SIMULATION
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';

class SolanaService {
  constructor() {
    // Use devnet for development - change to mainnet-beta for production
    this.connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    this.wallet = null;
    this.isConnected = false;
    
    console.log('SolanaService initialized with REAL Mobile Wallet Adapter');
    console.log('Source: https://github.com/solana-mobile/mobile-wallet-adapter');
  }

  // Connect to REAL mobile wallets ONLY - NO SIMULATION
  async connectWallet() {
    try {
      console.log('Connecting using REAL Mobile Wallet Adapter from GitHub...');
      console.log('This will ONLY work with actual wallet apps on device');
      
      // Use the REAL Mobile Wallet Adapter transact function
      const result = await transact(async (wallet) => {
        console.log('REAL Mobile Wallet Adapter session established');
        
        // Request authorization from REAL wallet
        console.log('About to call wallet.authorize...');
        const authorizationResult = await wallet.authorize({
          cluster: 'devnet', // Change to 'mainnet-beta' for production
          identity: {
            name: 'Solana P2P Payment',
            uri: 'https://solanap2p.app',
            // icon removed to prevent any URI issues
          },
          features: ['solana:signAndSendTransaction', 'solana:signTransaction', 'solana:signMessage'],
        });

        console.log('REAL wallet authorization successful:', authorizationResult);

        return {
          accounts: authorizationResult.accounts,
          authToken: authorizationResult.auth_token,
          walletUriBase: authorizationResult.wallet_uri_base,
        };
      });

      // Store REAL wallet information - SIMPLIFIED
      const firstAccount = result.accounts[0];
      
      console.log('Raw first account:', firstAccount);
      console.log('Raw address:', firstAccount.address);
      console.log('Address type:', typeof firstAccount.address);
      console.log('Address length:', firstAccount.address?.length);
      
      // Clean and validate the public key
      const rawPublicKey = firstAccount.address;
      console.log('Raw public key received:', rawPublicKey);
      
      // Try to clean and convert the key
      const cleanedKey = this.cleanPublicKeyString(rawPublicKey);
      console.log('Cleaned key result:', cleanedKey);
      
      if (!cleanedKey) {
        console.error('Failed to clean/convert public key from:', rawPublicKey);
        throw new Error('Invalid wallet public key format received from wallet');
      }
      
      // Double check the cleaned key is valid
      if (!this.isValidPublicKey(cleanedKey)) {
        console.error('Cleaned key failed validation:', cleanedKey);
        throw new Error('Invalid Solana public key format');
      }
      
      const publicKeyString = cleanedKey;
      console.log('Successfully converted and validated public key:', publicKeyString);
      
      // Use the cleaned account address
      this.wallet = {
        publicKey: publicKeyString,
        accounts: result.accounts,
        authToken: result.authToken,
        walletUriBase: result.walletUriBase,
        name: this.getWalletNameFromUriBase(result.walletUriBase),
        connected: true,
      };

      this.isConnected = true;

      console.log(`REAL wallet connected: ${this.wallet.name} (${typeof this.wallet.publicKey === 'string' ? this.wallet.publicKey : this.wallet.publicKey.toString()})`);

      // Get actual balance from Solana network
      const balance = await this.getBalance(this.wallet.publicKey);

      return {
        success: true,
        publicKey: this.wallet.publicKey.toString(),
        balance: balance,
        walletName: this.wallet.name,
        connected: true,
        accounts: result.accounts,
      };

    } catch (error) {
      console.error('REAL Mobile Wallet Adapter connection failed:', error);
      
      // Provide specific error messages for real MWA errors
      if (error.code === 'ERROR_WALLET_NOT_FOUND') {
        throw new Error('No compatible Solana wallet found. Please install Phantom, Solflare, or another Solana wallet.');
      } else if (error.code === 'ERROR_AUTHORIZATION_FAILED') {
        throw new Error('Wallet authorization was declined. Please try again and approve the connection.');
      } else if (error.code === 'ERROR_NOT_SIGNED') {
        throw new Error('Transaction was not signed. Please try again and approve the transaction.');
      } else if (error.message.includes('TurboModuleRegistry')) {
        throw new Error('Mobile Wallet Adapter requires a development build. Please create a development build to use real wallet connections.');
      } else {
        throw new Error(`Real wallet connection failed: ${error.message}`);
      }
    }
  }

  // Get wallet name from URI base (real wallet detection)
  getWalletNameFromUriBase(walletUriBase) {
    if (!walletUriBase) return 'Unknown Wallet';
    
    const walletMap = {
      'phantom': 'Phantom',
      'solflare': 'Solflare', 
      'backpack': 'Backpack',
      'glow': 'Glow Wallet',
      'slope': 'Slope',
      'coin98': 'Coin98',
      'trust': 'Trust Wallet',
      'exodus': 'Exodus',
    };
    
    for (const [key, name] of Object.entries(walletMap)) {
      if (walletUriBase.toLowerCase().includes(key)) {
        return name;
      }
    }
    
    return 'Solana Wallet';
  }

  // Get REAL SOL balance from Solana network
  async getBalance(publicKey) {
    try {
      const key = typeof publicKey === 'string' ? new PublicKey(publicKey) : publicKey;
      
      console.log('Fetching REAL balance from Solana devnet...');
      const balance = await this.connection.getBalance(key);
      const solBalance = balance / LAMPORTS_PER_SOL;
      
      console.log(`REAL balance fetched: ${solBalance} SOL`);
      return solBalance;
    } catch (error) {
      console.error('Error getting REAL balance:', error);
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  // Create REAL transfer transaction
  async createTransferTransaction(fromPublicKey, toPublicKey, amount, memo = '') {
    try {
      const fromKey = typeof fromPublicKey === 'string' ? new PublicKey(fromPublicKey) : fromPublicKey;
      const toKey = typeof toPublicKey === 'string' ? new PublicKey(toPublicKey) : toPublicKey;
      
      console.log('Creating REAL Solana transaction...');
      
      // Get recent blockhash from REAL network
      const { blockhash } = await this.connection.getLatestBlockhash();
      
      // Create REAL transfer instruction
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: fromKey,
        toPubkey: toKey,
        lamports: Math.floor(amount * LAMPORTS_PER_SOL),
      });

      // Create REAL transaction
      const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: fromKey,
      }).add(transferInstruction);

      console.log('REAL transaction created with blockhash:', blockhash);

      return {
        transaction: transaction.serialize({
          requireAllSignatures: false,
          verifySignatures: false,
        }).toString('base64'),
        metadata: {
          from: fromKey.toString(),
          to: toKey.toString(),
          amount,
          memo,
          blockhash,
          timestamp: Date.now(),
          fee: 0.000005,
          walletName: this.wallet?.name,
        },
      };
    } catch (error) {
      console.error('Error creating REAL transaction:', error);
      throw new Error(`Failed to create transaction: ${error.message}`);
    }
  }

  // Sign transaction with REAL mobile wallet using Mobile Wallet Adapter
  async signTransaction(transactionData) {
    try {
      if (!this.isConnected || !this.wallet) {
        throw new Error('REAL wallet not connected');
      }

      console.log(`Signing transaction with REAL ${this.wallet.name} using Mobile Wallet Adapter...`);

      const transaction = Transaction.from(
        Buffer.from(transactionData.transaction, 'base64')
      );

      // Use REAL Mobile Wallet Adapter to sign the transaction
      const result = await transact(async (wallet) => {
        console.log('Re-authorizing REAL wallet for transaction signing...');
        
        // Re-authorize if needed
        await wallet.reauthorize({
          auth_token: this.wallet.authToken,
          identity: {
            name: 'Solana P2P Payment',
            uri: 'https://solanap2p.app',
            // icon removed to prevent URI issues
          },
        });

        console.log('Requesting transaction signature from REAL wallet...');
        
        // Sign the transaction with the REAL wallet
        const signResult = await wallet.signTransactions({
          transactions: [transaction],
        });

        console.log('Transaction signed successfully by REAL wallet');
        
        return {
          signedTransactions: signResult.signedTransactions,
        };
      });

      const signedTransaction = result.signedTransactions[0];
      
      return {
        signedTransaction: signedTransaction.serialize().toString('base64'),
        signature: null, // Will be available after broadcast
        nonce: this.generateNonce(),
        walletName: this.wallet.name,
        timestamp: Date.now(),
      };

    } catch (error) {
      console.error('Error signing transaction with REAL wallet:', error);
      
      if (error.code === 'ERROR_NOT_SIGNED') {
        throw new Error('Transaction was declined in REAL wallet. Please try again and approve the transaction.');
      } else if (error.code === 'ERROR_REAUTHORIZE_FAILED') {
        throw new Error('REAL wallet re-authorization failed. Please reconnect your wallet.');
      } else {
        throw new Error(`Failed to sign transaction with REAL wallet: ${error.message}`);
      }
    }
  }

  // Broadcast REAL signed transaction to Solana network
  async broadcastTransaction(signedTransactionData) {
    try {
      console.log('Broadcasting REAL transaction to Solana devnet...');
      
      const transaction = Transaction.from(
        Buffer.from(signedTransactionData.signedTransaction, 'base64')
      );

      const signature = await this.connection.sendRawTransaction(
        transaction.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
          maxRetries: 3,
        }
      );

      console.log('REAL transaction broadcasted with signature:', signature);

      // Wait for confirmation on REAL network
      const confirmation = await this.connection.confirmTransaction({
        signature,
        blockhash: transaction.recentBlockhash,
        lastValidBlockHeight: (await this.connection.getLatestBlockhash()).lastValidBlockHeight,
      });

      if (confirmation.value.err) {
        throw new Error(`REAL transaction failed: ${confirmation.value.err}`);
      }

      console.log('REAL transaction confirmed on Solana network');

      return {
        success: true,
        signature,
        explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
        confirmation: confirmation.value,
      };
    } catch (error) {
      console.error('Error broadcasting REAL transaction:', error);
      throw new Error(`Failed to broadcast REAL transaction: ${error.message}`);
    }
  }

  // Send and sign transaction in one step using REAL MWA
  async sendTransaction(transactionData, options = {}) {
    try {
      if (!this.isConnected || !this.wallet) {
        throw new Error('REAL wallet not connected');
      }

      console.log(`Sending transaction with REAL ${this.wallet.name}...`);

      const transaction = Transaction.from(
        Buffer.from(transactionData.transaction, 'base64')
      );

      // Use REAL Mobile Wallet Adapter to sign and send
      const result = await transact(async (wallet) => {
        // Re-authorize if needed
        await wallet.reauthorize({
          auth_token: this.wallet.authToken,
          identity: {
            name: 'Solana P2P Payment',
            uri: 'https://solanap2p.app',
            // icon removed to prevent URI issues
          },
        });

        // Sign and send transaction with REAL wallet
        if (options.skipBroadcast) {
          const signResult = await wallet.signTransactions({
            transactions: [transaction],
          });
          
          return { signedTransactions: signResult.signedTransactions };
        } else {
          const sendResult = await wallet.signAndSendTransactions({
            transactions: [transaction],
            options: {
              commitment: 'confirmed',
              ...options,
            },
          });

          return { signatures: sendResult.signatures };
        }
      });

      if (options.skipBroadcast) {
        return {
          success: true,
          signedTransaction: result.signedTransactions[0].serialize().toString('base64'),
          signature: null,
        };
      } else {
        const signature = result.signatures[0];
        
        return {
          success: true,
          signature,
          explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
        };
      }

    } catch (error) {
      console.error('Error sending transaction with REAL wallet:', error);
      throw error;
    }
  }

  // Get available REAL wallet apps
  getAvailableWallets() {
    return [
      {
        name: 'Phantom',
        packageName: 'app.phantom',
        deepLink: 'phantom://',
        downloadUrl: 'https://phantom.app/download',
        icon: '👻',
        installed: false // Will be detected by MWA
      },
      {
        name: 'Solflare',
        packageName: 'com.solflare.mobile',
        deepLink: 'solflare://',
        downloadUrl: 'https://solflare.com/download',
        icon: '🔥',
        installed: false
      },
      {
        name: 'Backpack',
        packageName: 'app.backpack.wallet',
        deepLink: 'backpack://',
        downloadUrl: 'https://backpack.app/download',
        icon: '🎒',
        installed: false
      },
      {
        name: 'Glow Wallet',
        packageName: 'com.luma.wallet',
        deepLink: 'glow://',
        downloadUrl: 'https://glow.app/download',
        icon: '✨',
        installed: false
      }
    ];
  }

  // Check if wallet is installed (REAL detection via MWA)
  async isWalletInstalled(walletName) {
    console.log(`REAL wallet detection for ${walletName} will happen during MWA connection`);
    // Real detection happens when MWA tries to connect
    return true; // Let MWA handle the actual detection
  }

  // Disconnect REAL wallet
  disconnect() {
    if (this.wallet) {
      console.log(`Disconnecting REAL ${this.wallet.name}...`);
    }
    
    this.wallet = null;
    this.isConnected = false;
    console.log('REAL wallet disconnected');
  }

  // Get current REAL wallet info
  getWalletInfo() {
    return this.wallet ? {
      publicKey: typeof this.wallet.publicKey === 'string' ? this.wallet.publicKey : this.wallet.publicKey.toString(),
      name: this.wallet.name,
      connected: this.isConnected,
      accounts: this.wallet.accounts,
      authToken: this.wallet.authToken,
      walletUriBase: this.wallet.walletUriBase,
      source: 'real_mobile_wallet_adapter'
    } : {
      publicKey: null,
      name: null,
      connected: false,
      accounts: [],
      authToken: null,
      walletUriBase: null,
      source: 'real_mobile_wallet_adapter'
    };
  }

  // Validate a Solana public key
  isValidPublicKey(publicKeyString) {
    try {
      if (!publicKeyString) return false;
      
      // Clean the string first
      const cleanedKey = this.cleanPublicKeyString(publicKeyString);
      if (!cleanedKey) return false;
      
      // Validate the cleaned key
      new PublicKey(cleanedKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Clean a public key string to ensure it's valid base58
  cleanPublicKeyString(publicKeyString) {
    if (!publicKeyString) return null;
    
    try {
      // Check if it's already a valid base58 string
      const base58Pattern = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
      if (base58Pattern.test(publicKeyString)) {
        return publicKeyString;
      }
      
      // Check if it's base64 (contains characteristic base64 chars like +, /, =)
      if (publicKeyString.includes('+') || publicKeyString.includes('/') || publicKeyString.endsWith('=')) {
        // Convert base64 to buffer
        const buffer = Buffer.from(publicKeyString, 'base64');
        // Create PublicKey from buffer and get base58 string
        const pubKey = new PublicKey(buffer);
        return pubKey.toBase58();
      }
      
      return null;
    } catch (error) {
      console.error('Error cleaning public key:', error);
      return null;
    }
  }

  // Generate a unique nonce for transaction tracking
  generateNonce() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  // Get REAL transaction history from Solana network
  async getTransactionHistory(publicKey, limit = 10) {
    try {
      const key = typeof publicKey === 'string' ? new PublicKey(publicKey) : publicKey;
      
      console.log('Fetching REAL transaction history from Solana...');
      
      const signatures = await this.connection.getSignaturesForAddress(
        key,
        { limit }
      );

      const transactions = await Promise.all(
        signatures.map(async (sig) => {
          try {
            const tx = await this.connection.getTransaction(sig.signature, {
              commitment: 'confirmed',
              maxSupportedTransactionVersion: 0,
            });
            
            return {
              signature: sig.signature,
              timestamp: tx?.blockTime ? tx.blockTime * 1000 : Date.now(),
              status: sig.err ? 'failed' : 'confirmed',
              amount: this.extractTransferAmount(tx, key),
              fee: tx?.meta?.fee ? tx.meta.fee / LAMPORTS_PER_SOL : 0,
              source: 'real_solana_network'
            };
          } catch (error) {
            console.error('Error fetching REAL transaction:', error);
            return null;
          }
        })
      );

      const validTransactions = transactions.filter(tx => tx !== null);
      console.log(`REAL transaction history fetched: ${validTransactions.length} transactions`);
      
      return validTransactions;
    } catch (error) {
      console.error('Error getting REAL transaction history:', error);
      return [];
    }
  }

  // Extract transfer amount from REAL transaction
  extractTransferAmount(transaction, userPublicKey) {
    try {
      if (!transaction?.meta?.preBalances || !transaction?.meta?.postBalances) {
        return 0;
      }

      // Find the account index for the user's public key
      const accountKeys = transaction.transaction.message.accountKeys;
      const userAccountIndex = accountKeys.findIndex(key => 
        key.toString() === userPublicKey.toString()
      );

      if (userAccountIndex === -1) return 0;

      // Calculate balance change
      const preBalance = transaction.meta.preBalances[userAccountIndex];
      const postBalance = transaction.meta.postBalances[userAccountIndex];
      const balanceChange = (postBalance - preBalance) / LAMPORTS_PER_SOL;

      return Math.abs(balanceChange);
    } catch (error) {
      console.error('Error extracting transfer amount from REAL transaction:', error);
      return 0;
    }
  }
}

export default new SolanaService();