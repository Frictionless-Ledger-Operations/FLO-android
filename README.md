# Solana P2P - Offline Peer-to-Peer Payment App

A minimalist, mobile-first React Native (Expo) application for offline peer-to-peer Solana payments using NFC technology, Solayer zkLogin authentication, and the Solana Mobile Adapter.

## 🚀 Features

### Core Functionality
- **🔐 Secure Authentication**: Solayer zkLogin integration for zero-knowledge privacy
- **📱 NFC Transactions**: Offline peer-to-peer payments via NFC tap
- **⚡ Solana Integration**: Low-fee, high-throughput transactions on Solana network
- **🌐 Offline Capable**: Create and transfer transactions without internet connection
- **🔄 Smart Sync**: Automatic broadcasting when device comes online

### App Flow
1. **Login**: Secure authentication via Solayer zkLogin
2. **Create Payment**: Set amount, recipient, and memo
3. **Sign Transaction**: Offline transaction signing using Solana Mobile Adapter
4. **NFC Transfer**: Tap-to-transfer signed transaction data
5. **Receive & Finalize**: Recipient reviews and finalizes transaction
6. **Broadcast**: Sync and broadcast to Solana network when online

## 🎨 Design

### Theme
- **Dark Mode**: Solana-inspired colors (deep navy, purple, teal)
- **Mobile-First**: Optimized for Android phones with NFC
- **Minimalist UI**: Clean interface focused on clarity and ease of use
- **Subtle Animations**: Simple pulse effects for NFC interactions

### Color Palette
- Primary: `#14F195` (Solana Green)
- Secondary: `#9945FF` (Solana Purple)
- Accent: `#00D4AA` (Teal)
- Background: `#0A0F1C` (Deep Navy)
- Surface: `#1A1F36` (Lighter Navy)

## 📱 Screens

### 1. Login Screen
- Solayer zkLogin integration
- Demo mode for testing
- Feature highlights

### 2. Home Screen
- Wallet balance display
- Quick actions (Send/Receive)
- Status indicators (Online/NFC/Pending)
- Recent transactions

### 3. Create Payment Screen
- Amount input with validation
- Recipient address (with QR scanner)
- Optional memo field
- Transaction summary

### 4. NFC Send Screen
- Transaction signing
- Animated NFC transfer area
- Real-time status updates
- Transfer completion feedback

### 5. Receive Screen
- NFC listening mode
- Animated pulse effects
- Incoming transaction display
- Auto-navigation to finalization

### 6. Finalize Screen
- Transaction verification
- Security checks
- Review transaction details
- Finalization confirmation

### 7. Sync Screen
- Pending transactions list
- Completed transactions history
- Batch broadcasting
- Network status monitoring

## 🛠 Technology Stack

### Frontend
- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and toolchain
- **React Navigation**: Navigation library

### Blockchain
- **@solana/web3.js**: Solana blockchain interaction
- **@solana-mobile/wallet-adapter-mobile**: Mobile wallet integration
- **Solayer zkLogin**: Zero-knowledge authentication (simulated)

### NFC & Storage
- **react-native-nfc-manager**: NFC functionality
- **@react-native-async-storage/async-storage**: Local data persistence

## 🚦 Prerequisites

### Development Environment
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)

### Device Requirements
- Android device with NFC capability
- Android 6.0 (API level 23) or higher
- NFC enabled in device settings

### Wallet Requirements
- Solana Mobile Adapter compatible wallet
- For demo: Any Solana wallet for testing

## ⚡ Quick Start

### 1. Installation
```bash
# Clone the repository
git clone <repository-url>
cd SolanaP2P

# Install dependencies
npm install

# Start the development server
npm start
```

### 2. Running on Device
```bash
# For Android
npm run android

# Using Expo Go app
# Scan QR code with Expo Go app
```

### 3. Building for Production
```bash
# Build for Android
npx eas build --platform android

# Build APK for local testing
npx eas build --platform android --profile preview
```

## 🔧 Configuration

### Environment Setup
1. **Solana Network**: Currently configured for Devnet
   - Change RPC endpoint in `src/services/SolanaService.js` for Mainnet
2. **Solayer Integration**: Replace mock implementation with actual zkLogin
3. **NFC Permissions**: Ensure NFC permissions in `app.json`

### Package.json Scripts
```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "build:android": "eas build --platform android",
    "build:ios": "eas build --platform ios"
  }
}
```

## 📖 Usage Guide

### For Senders
1. **Login** with Solayer zkLogin or demo mode
2. **Create Payment** by entering amount and recipient details
3. **Review** transaction summary and fees
4. **Tap NFC** area and bring device close to receiver
5. **Confirm** successful transfer
6. **Sync** when online to broadcast to blockchain

### For Receivers
1. **Start Listening** for NFC payments
2. **Bring device close** to sender during transfer
3. **Review** received transaction details
4. **Finalize** transaction after verification
5. **Broadcast** when online to complete payment

## 🔒 Security Features

### Authentication
- Zero-knowledge proofs via Solayer zkLogin
- No private key storage on device
- Secure wallet adapter integration

### Transaction Security
- Cryptographic signature verification
- Transaction data integrity checks
- Offline signing with online broadcasting
- Nonce-based transaction tracking

### NFC Security
- Encrypted transaction data transfer
- Validation of received data integrity
- Prevention of replay attacks

## 🛡 Error Handling

### Network Issues
- Graceful offline mode handling
- Automatic retry mechanisms
- Clear network status indicators

### NFC Errors
- Device compatibility checks
- Permission handling
- Transfer failure recovery

### Transaction Errors
- Input validation
- Balance verification
- Signing error recovery

## 🧪 Testing

### Demo Mode
- Use demo login for testing without wallet
- Mock transaction data for UI testing
- Simulated NFC transfers for development

### Real Device Testing
- Test on Android devices with NFC
- Verify with actual Solana wallets
- Test offline/online scenarios

## 📚 Project Structure

```
src/
├── components/          # Reusable UI components
│   └── Navigation.js    # App navigation setup
├── context/            # React Context for state management
│   └── AppContext.js   # Global app state
├── screens/            # Screen components
│   ├── LoginScreen.js
│   ├── HomeScreen.js
│   ├── CreatePaymentScreen.js
│   ├── NFCSendScreen.js
│   ├── ReceiveScreen.js
│   ├── FinalizeScreen.js
│   └── SyncScreen.js
├── services/           # External service integrations
│   ├── NFCService.js   # NFC communication
│   └── SolanaService.js # Blockchain interactions
├── styles/             # Theme and styling
│   ├── theme.js        # Color palette and spacing
│   └── globalStyles.js # Shared styles
└── utils/              # Utility functions
    └── helpers.js      # Common helper functions
```

## 🔮 Future Enhancements

### Planned Features
- **QR Code Backup**: Alternative to NFC for transaction transfer
- **Multi-token Support**: SPL token transfers
- **Transaction History Export**: CSV/PDF export functionality
- **Enhanced Security**: Biometric authentication
- **Group Payments**: Split payments among multiple recipients

### Technical Improvements
- **Offline Storage Encryption**: Enhanced local data security
- **Background Sync**: Automatic broadcasting in background
- **Push Notifications**: Transaction status updates
- **Analytics**: Transaction insights and reporting

## 🤝 Contributing

### Development Guidelines
1. Follow React Native best practices
2. Maintain consistent code formatting
3. Add proper error handling
4. Include comprehensive comments
5. Test on multiple Android devices

### Code Style
- Use functional components with hooks
- Implement proper TypeScript (if migrating)
- Follow naming conventions
- Keep components focused and reusable

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Common Issues
1. **NFC not working**: Ensure NFC is enabled in device settings
2. **Wallet connection fails**: Check Solana Mobile Adapter installation
3. **Transaction fails**: Verify sufficient balance and network connection
4. **App crashes**: Check device compatibility and permissions

### Getting Help
- Check the Issues section for known problems
- Create new issue with detailed error information
- Include device model and Android version
- Provide steps to reproduce the issue

## 🙏 Acknowledgments

- **Solana Foundation**: For the amazing blockchain platform
- **Solayer**: For zkLogin authentication technology
- **React Native Community**: For excellent tooling and libraries
- **Expo Team**: For simplifying mobile development

---

**Note**: This is a demo application showcasing offline P2P payments. For production use, ensure proper security audits and compliance with financial regulations.