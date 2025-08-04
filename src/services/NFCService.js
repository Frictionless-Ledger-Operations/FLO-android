import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';

class NFCService {
  constructor() {
    this.isInitialized = false;
    this.isListening = false;
    this.hasNFCSupport = false;
    this.isNFCEnabled = false;
  }

  async initialize() {
    try {
      // Check if already initialized
      if (this.isInitialized) {
        return { 
          supported: this.hasNFCSupport, 
          enabled: this.isNFCEnabled 
        };
      }

      console.log('Initializing NFC Manager...');
      
      // Check NFC support
      const supported = await NfcManager.isSupported();
      if (!supported) {
        console.error('NFC is not supported on this device');
        this.hasNFCSupport = false;
        return { supported: false, enabled: false };
      }

      // Start NFC manager
      await NfcManager.start();
      
      // Check if NFC is enabled
      const enabled = await NfcManager.isEnabled();
      
      // Store state
      this.isInitialized = true;
      this.hasNFCSupport = true;
      this.isNFCEnabled = enabled;
      
      console.log('NFC initialized successfully, enabled:', enabled);
      
      return { supported: true, enabled };
    } catch (error) {
      console.error('NFC initialization failed:', error);
      this.cleanup();
      return { supported: false, enabled: false };
    }
  }

  async isEnabled() {
    try {
      const enabled = await NfcManager.isEnabled();
      console.log('REAL NFC enabled status:', enabled);
      return enabled;
    } catch (error) {
      console.error('Error checking REAL NFC status:', error);
      return false;
    }
  }

  async sendTransactionData(transactionData) {
    try {
      // Ensure NFC is ready
      if (!this.isInitialized || !this.isNFCEnabled) {
        const status = await this.initialize();
        if (!status.supported || !status.enabled) {
          throw new Error('NFC is not available');
        }
      }

      console.log('Preparing to send transaction via NFC...');

      // Convert transaction data to JSON string
      const dataString = JSON.stringify({
        type: 'SOLANA_P2P_TRANSACTION',
        version: '1.0',
        timestamp: Date.now(),
        data: transactionData,
      });

      console.log('NFC data prepared:', dataString.length, 'characters');

      // Create NDEF message
      const bytes = Ndef.encodeMessage([
        Ndef.textRecord(dataString),
      ]);

      // Cancel any existing NFC operations
      await NfcManager.cancelTechnologyRequest().catch(() => null);
      
      // Request NFC technology
      await NfcManager.requestTechnology(NfcTech.Ndef, {
        alertMessage: 'Hold your device near the receiver...'
      });
      
      console.log('Writing NFC data...');
      
      // Write NDEF message
      await NfcManager.ndefHandler.writeNdefMessage(bytes);
      
      console.log('NFC data written successfully');
      
      return { success: true };
    } catch (error) {
      console.error('Error sending REAL transaction data via NFC:', error);
      throw new Error(`Failed to send transaction: ${error.message}`);
    } finally {
      try {
        await NfcManager.cancelTechnologyRequest();
        console.log('REAL NFC technology request cancelled');
      } catch (e) {
        console.error('Error canceling REAL NFC request:', e);
      }
    }
  }

  async listenForTransaction(onTransactionReceived, onError) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Cancel any existing NFC operations
      await NfcManager.cancelTechnologyRequest();
      
      this.isListening = true;
      console.log('Starting REAL NFC listener for transactions...');

      // Request NFC technology first
      await NfcManager.requestTechnology(NfcTech.Ndef);

      // Start listening for REAL NFC tags
      await NfcManager.registerTagEvent((tag) => {
        try {
          console.log('REAL NFC tag detected:', tag);
          
          // Parse NDEF records from REAL NFC tag
          const ndefRecords = tag.ndefMessage;
          if (ndefRecords && ndefRecords.length > 0) {
            console.log('REAL NFC NDEF records found:', ndefRecords.length);
            
            // Decode the first text record
            const textRecord = ndefRecords.find(record => 
              record.tnf === Ndef.TNF_WELL_KNOWN && 
              record.type && 
              record.type.length === 1 && 
              record.type[0] === 0x54 // 'T' for text
            );

            if (textRecord) {
              console.log('REAL NFC text record found, decoding...');
              
              const text = Ndef.text.decodePayload(textRecord.payload);
              console.log('REAL NFC decoded text:', text.substring(0, 100) + '...');
              
              const transactionData = JSON.parse(text);

              // Validate transaction data
              if (this.validateTransactionData(transactionData)) {
                console.log('REAL NFC transaction data validated successfully');
                onTransactionReceived(transactionData.data);
              } else {
                console.error('REAL NFC transaction data validation failed');
                onError(new Error('Invalid transaction data received'));
              }
            } else {
              console.error('REAL NFC no text record found in tag');
              onError(new Error('No valid text record found in NFC tag'));
            }
          } else {
            console.error('REAL NFC no NDEF records found in tag');
            onError(new Error('No NDEF records found in NFC tag'));
          }
        } catch (error) {
          console.error('Error processing REAL NFC tag:', error);
          onError(new Error(`Failed to process NFC data: ${error.message}`));
        }
      });

      console.log('REAL NFC listener registered successfully');
      return { success: true };
    } catch (error) {
      console.error('Error starting REAL NFC listener:', error);
      this.isListening = false;
      throw new Error(`Failed to start NFC listener: ${error.message}`);
    }
  }

  async stopListening() {
    try {
      if (this.isListening) {
        // Unregister tag event listener
        await NfcManager.unregisterTagEvent();
        
        // Cancel any pending NFC operations
        await NfcManager.cancelTechnologyRequest().catch(() => null);
        
        this.isListening = false;
        console.log('NFC listener stopped');
      }
      return { success: true };
    } catch (error) {
      console.error('Error stopping NFC listener:', error);
      
      // Attempt force cleanup
      try {
        await NfcManager.unregisterTagEvent();
        await NfcManager.cancelTechnologyRequest();
      } catch (e) {
        console.error('Force stop failed:', e);
      }
      
      this.isListening = false;
      throw new Error(`Failed to stop NFC listener: ${error.message}`);
    }
  }

  validateTransactionData(data) {
    try {
      // Basic validation of transaction data structure
      const isValid = (
        data &&
        data.type === 'SOLANA_P2P_TRANSACTION' &&
        data.version === '1.0' &&
        data.data &&
        typeof data.data === 'object' &&
        data.data.metadata
      );
      
      console.log('REAL NFC transaction data validation result:', isValid);
      return isValid;
    } catch (error) {
      console.error('Error validating REAL NFC transaction data:', error);
      return false;
    }
  }

  async cleanup() {
    try {
      // Stop listening if active
      if (this.isListening) {
        await this.stopListening();
      }

      // Cancel any pending NFC operations
      await NfcManager.cancelTechnologyRequest().catch(() => null);

      // Stop NFC manager if initialized
      if (this.isInitialized) {
        await NfcManager.stop();
      }

      // Reset state
      this.isInitialized = false;
      this.isListening = false;
      this.hasNFCSupport = false;
      this.isNFCEnabled = false;

      console.log('NFC service cleaned up successfully');
    } catch (error) {
      console.error('Error cleaning up NFC service:', error);
      // Attempt force cleanup
      try {
        await NfcManager.stop();
      } catch (e) {
        console.error('Force cleanup failed:', e);
      }
    }
  }

  // Utility method to check if device supports NFC
  static async checkSupport() {
    try {
      const supported = await NfcManager.isSupported();
      console.log('REAL NFC support check:', supported);
      return supported;
    } catch (error) {
      console.error('Error checking REAL NFC support:', error);
      return false;
    }
  }

  // Method to prompt user to enable NFC
  async promptEnableNFC() {
    try {
      console.log('Opening REAL NFC settings...');
      await NfcManager.goToNfcSetting();
    } catch (error) {
      console.error('Error opening REAL NFC settings:', error);
      throw new Error('Unable to open NFC settings');
    }
  }

  // Get current NFC status
  async getStatus() {
    try {
      const supported = await NfcManager.isSupported();
      const enabled = supported ? await NfcManager.isEnabled() : false;
      
      const status = {
        supported,
        enabled,
        initialized: this.isInitialized,
        listening: this.isListening
      };
      
      console.log('NFC status:', status);
      return status;
    } catch (error) {
      console.error('Error getting NFC status:', error);
      return {
        supported: false,
        enabled: false,
        initialized: false,
        listening: false
      };
    }
  }

  // Helper method to ensure NFC is ready
  async ensureNFCReady() {
    if (!this.isInitialized || !this.isNFCEnabled) {
      const status = await this.initialize();
      if (!status.supported || !status.enabled) {
        throw new Error('NFC is not available or enabled');
      }
    }
  }

  // Helper method to prepare for NFC operations
  async prepareNFCOperation() {
    await this.ensureNFCReady();
    await this.stopListening();
    await NfcManager.cancelTechnologyRequest().catch(() => null);
  }

  // Helper method to handle NFC errors
  handleNFCError(error, operation) {
    console.error(`NFC ${operation} error:`, error);
    this.cleanup().catch(console.error);
    throw new Error(`NFC ${operation} failed: ${error.message}`);
  }
}

export default new NFCService();