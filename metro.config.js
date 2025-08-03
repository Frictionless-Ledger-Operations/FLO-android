const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add Buffer and crypto polyfills for Solana
config.resolver.alias = {
  crypto: require.resolve('expo-crypto'),
  stream: require.resolve('readable-stream'),
  buffer: require.resolve('buffer'),
};

config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;