import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { globalStyles } from '../styles/globalStyles';
import { colors } from '../styles/theme';

const LoadingSpinner = ({ 
  message = 'Loading...', 
  size = 'large', 
  color = colors.primary,
  style = {} 
}) => {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text style={[globalStyles.captionText, styles.message]}>
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = {
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  message: {
    marginTop: 12,
    textAlign: 'center',
  },
};

export default LoadingSpinner;