import React from 'react';
import { View, Text } from 'react-native';
import { globalStyles } from '../styles/globalStyles';
import { colors } from '../styles/theme';

const StatusBadge = ({ 
  status, 
  text, 
  icon, 
  size = 'medium' 
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'online':
      case 'success':
      case 'completed':
        return colors.success;
      case 'offline':
      case 'warning':
      case 'pending':
        return colors.warning;
      case 'error':
      case 'failed':
        return colors.error;
      case 'info':
      case 'received':
        return colors.info;
      default:
        return colors.textMuted;
    }
  };

  const getBadgeSize = () => {
    switch (size) {
      case 'small':
        return { width: 8, height: 8, borderRadius: 4 };
      case 'large':
        return { width: 16, height: 16, borderRadius: 8 };
      default:
        return { width: 12, height: 12, borderRadius: 6 };
    }
  };

  const getTextStyle = () => {
    switch (size) {
      case 'small':
        return { fontSize: 12 };
      case 'large':
        return { fontSize: 16 };
      default:
        return { fontSize: 14 };
    }
  };

  return (
    <View style={styles.container}>
      <View style={[
        styles.indicator,
        getBadgeSize(),
        { backgroundColor: getStatusColor() }
      ]} />
      {icon && (
        <Text style={[styles.icon, getTextStyle()]}>
          {icon}
        </Text>
      )}
      {text && (
        <Text style={[
          globalStyles.captionText,
          getTextStyle(),
          { color: colors.textSecondary }
        ]}>
          {text}
        </Text>
      )}
    </View>
  );
};

const styles = {
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  indicator: {
    // Dimensions set by getBadgeSize()
  },
  icon: {
    marginLeft: 2,
  },
};

export default StatusBadge;