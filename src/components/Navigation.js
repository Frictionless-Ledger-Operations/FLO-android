import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import { colors } from '../styles/theme';
import { useApp } from '../context/AppContext';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import CreatePaymentScreen from '../screens/CreatePaymentScreen';
import NFCSendScreen from '../screens/NFCSendScreen';
import ReceiveScreen from '../screens/ReceiveScreen';
import FinalizeScreen from '../screens/FinalizeScreen';
import SyncScreen from '../screens/SyncScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator for main app screens
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Send"
        component={CreatePaymentScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>💸</Text>
          ),
          tabBarLabel: 'Send',
        }}
      />
      <Tab.Screen
        name="Receive"
        component={ReceiveScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📱</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Sync"
        component={SyncScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>🔄</Text>
          ),
          tabBarLabel: 'History',
        }}
      />
    </Tab.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  const { state } = useApp();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: colors.background },
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      >
        {!state.isAuthenticated ? (
          // Auth Stack - Only show when not authenticated
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ 
              gestureEnabled: false,
              animationTypeForReplace: 'push'
            }}
          />
        ) : (
          // Main App Stack - Only show when authenticated
          <>
            <Stack.Screen
              name="Main"
              component={MainTabs}
              options={{ 
                gestureEnabled: false,
                animationTypeForReplace: 'push'
              }}
            />
            <Stack.Screen
              name="CreatePayment"
              component={CreatePaymentScreen}
              options={{
                presentation: 'modal',
                headerShown: true,
                headerTitle: 'Create Payment',
                headerStyle: {
                  backgroundColor: colors.surface,
                },
                headerTintColor: colors.text,
                headerTitleStyle: {
                  fontWeight: '600',
                },
              }}
            />
            <Stack.Screen
              name="NFCSend"
              component={NFCSendScreen}
              options={{
                presentation: 'modal',
                headerShown: true,
                headerTitle: 'Send via NFC',
                headerStyle: {
                  backgroundColor: colors.surface,
                },
                headerTintColor: colors.text,
                headerTitleStyle: {
                  fontWeight: '600',
                },
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="Finalize"
              component={FinalizeScreen}
              options={{
                presentation: 'modal',
                headerShown: true,
                headerTitle: 'Finalize Payment',
                headerStyle: {
                  backgroundColor: colors.surface,
                },
                headerTintColor: colors.text,
                headerTitleStyle: {
                  fontWeight: '600',
                },
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;