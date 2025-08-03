import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { globalStyles } from '../styles/globalStyles';
import { colors } from '../styles/theme';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={globalStyles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={globalStyles.title}>Something went wrong</Text>
          <Text style={[globalStyles.captionText, styles.errorMessage]}>
            An unexpected error occurred. Please try again.
          </Text>
          
          {__DEV__ && this.state.error && (
            <View style={styles.debugContainer}>
              <Text style={globalStyles.errorText}>
                {this.state.error.toString()}
              </Text>
            </View>
          )}
          
          <TouchableOpacity
            style={globalStyles.button}
            onPress={this.handleRetry}
          >
            <Text style={globalStyles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = {
  errorIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 32,
  },
  debugContainer: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    marginHorizontal: 16,
  },
};

export default ErrorBoundary;