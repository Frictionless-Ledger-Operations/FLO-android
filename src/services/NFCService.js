import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';

class NFCService {
  constructor() {
    this.isInitialized = false;
    this.isListening = false;
  }

  async initialize() {
    try {
      console.log('Initializing REAL NFC Manager...');
      
      const supported = await NfcManager.isSupported();
      if (!supported) {
        console.error('REAL NFC is not supported on this device');
        throw new Error('NFC is not supported on this device');
      }

      await NfcManager.start();
      this.isInitialized = true;
      
      const enabled = await NfcManager.isEnabled();
      console.log('REAL NFC initialized successfully, enabled:', enabled);
      
      return { supported: true, enabled };
    } catch (error) {
      console.error('REAL NFC initialization failed:', error);
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
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('Sending REAL transaction data via NFC...');

      // Convert transaction data to JSON string
      const dataString = JSON.stringify({
        type: 'SOLANA_P2P_TRANSACTION',
        version: '1.0',
        timestamp: Date.now(),
        data: transactionData,
      });

      console.log('REAL NFC data to send:', dataString.length, 'characters');

      // Create NDEF record using REAL NFC manager
      const bytes = Ndef.encodeMessage([
        Ndef.textRecord(dataString),
      ]);

      // Start REAL NFC technology and write data
      await NfcManager.requestTechnology(NfcTech.Ndef);
      
      console.log('REAL NFC technology requested, writing data...');
      
      await NfcManager.ndefHandler.writeNdefMessage(bytes);
      
      console.log('REAL NFC data written successfully');
      
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

      this.isListening = true;
      console.log('Starting REAL NFC listener for transactions...');

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
        await NfcManager.unregisterTagEvent();
        this.isListening = false;
        console.log('REAL NFC listener stopped');
      }
      return { success: true };
    } catch (error) {
      console.error('Error stopping REAL NFC listener:', error);
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
      await this.stopListening();
      if (this.isInitialized) {
        await NfcManager.stop();
        this.isInitialized = false;
        console.log('REAL NFC cleaned up successfully');
      }
    } catch (error) {
      console.error('Error cleaning up REAL NFC service:', error);
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
      
      console.log('REAL NFC status:', status);
      return status;
    } catch (error) {
      console.error('Error getting REAL NFC status:', error);
      return {
        supported: false,
        enabled: false,
        initialized: false,
        listening: false
      };
    }
  }
}

export default new NFCService();