// Format SOL amount for display
export const formatSOL = (amount) => {
  if (amount === 0) return '0 SOL';
  if (amount < 0.001) return '<0.001 SOL';
  return `${amount.toFixed(3)} SOL`;
};

// Format large numbers with commas
export const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Truncate public key for display
export const truncatePublicKey = (publicKey, chars = 4) => {
  if (!publicKey) return '';
  if (publicKey.length <= chars * 2) return publicKey;
  return `${publicKey.slice(0, chars)}...${publicKey.slice(-chars)}`;
};

// Format timestamp to readable date
export const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

// Generate random recipient name for demo purposes
export const generateRandomName = () => {
  const names = [
    'Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson',
    'Emma Brown', 'Frank Miller', 'Grace Lee', 'Henry Garcia',
    'Ivy Chen', 'Jack Taylor', 'Kate Anderson', 'Liam Moore'
  ];
  return names[Math.floor(Math.random() * names.length)];
};

// Validate SOL amount input
export const validateSOLAmount = (amount) => {
  const num = parseFloat(amount);
  
  if (isNaN(num)) {
    return { valid: false, error: 'Please enter a valid number' };
  }
  
  if (num <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }
  
  if (num > 1000000) {
    return { valid: false, error: 'Amount too large' };
  }
  
  // Check for too many decimal places
  const decimalPlaces = (amount.toString().split('.')[1] || '').length;
  if (decimalPlaces > 9) {
    return { valid: false, error: 'Maximum 9 decimal places allowed' };
  }
  
  return { valid: true, amount: num };
};

// Generate unique transaction ID
export const generateTransactionId = () => {
  return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Sleep utility for delays
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Check if device is online (simple implementation)
export const checkOnlineStatus = async () => {
  try {
    // Simple ping to Solana devnet
    const response = await fetch('https://api.devnet.solana.com', {
      method: 'HEAD',
      timeout: 5000,
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Deep clone object
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Debounce function for input handling
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Generate QR code data for emergency backup
export const generateBackupQR = (transactionData) => {
  return JSON.stringify({
    type: 'SOLANA_P2P_BACKUP',
    version: '1.0',
    data: transactionData,
    timestamp: Date.now(),
  });
};

// Parse backup QR code
export const parseBackupQR = (qrData) => {
  try {
    const parsed = JSON.parse(qrData);
    if (parsed.type === 'SOLANA_P2P_BACKUP' && parsed.version === '1.0') {
      return { success: true, data: parsed.data };
    }
    return { success: false, error: 'Invalid backup QR code' };
  } catch (error) {
    return { success: false, error: 'Failed to parse QR code' };
  }
};

// Calculate transaction fee estimate
export const estimateTransactionFee = () => {
  // Simplified fee calculation - in reality this would query the network
  return 0.000005; // 5000 lamports typical fee
};

// Validate memo text
export const validateMemo = (memo) => {
  if (!memo) return { valid: true };
  
  if (memo.length > 100) {
    return { valid: false, error: 'Memo must be 100 characters or less' };
  }
  
  // Check for valid characters (basic validation)
  const validChars = /^[a-zA-Z0-9\s\-_.,!?]*$/;
  if (!validChars.test(memo)) {
    return { valid: false, error: 'Memo contains invalid characters' };
  }
  
  return { valid: true };
};

// Get relative time string
export const getRelativeTime = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
};

// Network status checker with retry
export const checkNetworkWithRetry = async (maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    const isOnline = await checkOnlineStatus();
    if (isOnline) return true;
    
    if (i < maxRetries - 1) {
      await sleep(1000 * Math.pow(2, i)); // Exponential backoff
    }
  }
  return false;
};