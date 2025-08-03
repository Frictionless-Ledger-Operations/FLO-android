import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SolanaService from '../services/SolanaService';
import NFCService from '../services/NFCService';

// Initial state
const initialState = {
  // Authentication
  isAuthenticated: false,
  user: null,
  wallet: null,
  
  // Network status
  isOnline: false,
  
  // Transactions
  pendingTransactions: [],
  completedTransactions: [],
  currentTransaction: null,
  
  // NFC status
  nfcEnabled: false,
  nfcSupported: false,
  
  // UI state
  loading: false,
  error: null,
};

// Action types
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  
  // Auth actions
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  
  // Network actions
  SET_ONLINE_STATUS: 'SET_ONLINE_STATUS',
  
  // Transaction actions
  CREATE_TRANSACTION: 'CREATE_TRANSACTION',
  SIGN_TRANSACTION: 'SIGN_TRANSACTION',
  RECEIVE_TRANSACTION: 'RECEIVE_TRANSACTION',
  FINALIZE_TRANSACTION: 'FINALIZE_TRANSACTION',
  BROADCAST_TRANSACTION: 'BROADCAST_TRANSACTION',
  CLEAR_CURRENT_TRANSACTION: 'CLEAR_CURRENT_TRANSACTION',
  
  // NFC actions
  SET_NFC_STATUS: 'SET_NFC_STATUS',
  
  // Storage actions
  LOAD_STORED_DATA: 'LOAD_STORED_DATA',
};

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case ActionTypes.CLEAR_ERROR:
      return { ...state, error: null };
    
    case ActionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        wallet: action.payload.wallet,
        loading: false,
      };
    
    case ActionTypes.LOGOUT:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        wallet: null,
        currentTransaction: null,
      };
    
    case ActionTypes.SET_ONLINE_STATUS:
      return { ...state, isOnline: action.payload };
    
    case ActionTypes.CREATE_TRANSACTION:
      return {
        ...state,
        currentTransaction: {
          ...action.payload,
          status: 'created',
          timestamp: Date.now(),
        },
      };
    
    case ActionTypes.SIGN_TRANSACTION:
      return {
        ...state,
        currentTransaction: {
          ...state.currentTransaction,
          ...action.payload,
          status: 'signed',
        },
      };
    
    case ActionTypes.RECEIVE_TRANSACTION:
      return {
        ...state,
        currentTransaction: {
          ...action.payload,
          status: 'received',
          receivedAt: Date.now(),
        },
      };
    
    case ActionTypes.FINALIZE_TRANSACTION:
      return {
        ...state,
        currentTransaction: {
          ...state.currentTransaction,
          status: 'finalized',
          finalizedAt: Date.now(),
        },
        pendingTransactions: [
          ...state.pendingTransactions,
          {
            ...state.currentTransaction,
            status: 'finalized',
            finalizedAt: Date.now(),
          },
        ],
      };
    
    case ActionTypes.BROADCAST_TRANSACTION:
      const broadcastedTx = state.pendingTransactions.find(
        tx => tx.id === action.payload.id
      );
      
      return {
        ...state,
        pendingTransactions: state.pendingTransactions.filter(
          tx => tx.id !== action.payload.id
        ),
        completedTransactions: [
          ...state.completedTransactions,
          {
            ...broadcastedTx,
            status: 'completed',
            broadcastedAt: Date.now(),
            signature: action.payload.signature,
          },
        ],
      };
    
    case ActionTypes.CLEAR_CURRENT_TRANSACTION:
      return { ...state, currentTransaction: null };
    
    case ActionTypes.SET_NFC_STATUS:
      return {
        ...state,
        nfcEnabled: action.payload.enabled,
        nfcSupported: action.payload.supported,
      };
    
    case ActionTypes.LOAD_STORED_DATA:
      return {
        ...state,
        ...action.payload,
      };
    
    default:
      return state;
  }
};

// Context
const AppContext = createContext();

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load stored data on app start
  useEffect(() => {
    loadStoredData();
  }, []);

  // Save important data to storage whenever state changes
  useEffect(() => {
    saveToStorage();
  }, [state.pendingTransactions, state.completedTransactions]);

  const loadStoredData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('appData');
      if (storedData) {
        const data = JSON.parse(storedData);
        dispatch({
          type: ActionTypes.LOAD_STORED_DATA,
          payload: {
            pendingTransactions: data.pendingTransactions || [],
            completedTransactions: data.completedTransactions || [],
          },
        });
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    }
  };

  const saveToStorage = async () => {
    try {
      const dataToStore = {
        pendingTransactions: state.pendingTransactions,
        completedTransactions: state.completedTransactions,
      };
      await AsyncStorage.setItem('appData', JSON.stringify(dataToStore));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  // Action creators
  const actions = {
    setLoading: (loading) => dispatch({ type: ActionTypes.SET_LOADING, payload: loading }),
    setError: (error) => dispatch({ type: ActionTypes.SET_ERROR, payload: error }),
    clearError: () => dispatch({ type: ActionTypes.CLEAR_ERROR }),
    
    loginSuccess: (user, wallet) => dispatch({
      type: ActionTypes.LOGIN_SUCCESS,
      payload: { user, wallet },
    }),
    logout: async () => {
      try {
        console.log('Logging out - cleaning up all services...');
        
        // Disconnect wallet and cleanup services
        await Promise.all([
          SolanaService.disconnect(),
          NFCService.cleanup().catch(e => console.error('NFC cleanup error:', e))
        ]);
        
        // Clear local storage
        await AsyncStorage.removeItem('appData');
        
        console.log('All services logged out successfully');
        dispatch({ type: ActionTypes.LOGOUT });
      } catch (error) {
        console.error('Logout error:', error);
        // Force logout even if cleanup fails
        dispatch({ type: ActionTypes.LOGOUT });
      }
    },
    
    setOnlineStatus: (isOnline) => dispatch({
      type: ActionTypes.SET_ONLINE_STATUS,
      payload: isOnline,
    }),
    
    createTransaction: (transactionData) => dispatch({
      type: ActionTypes.CREATE_TRANSACTION,
      payload: transactionData,
    }),
    
    signTransaction: (signedData) => dispatch({
      type: ActionTypes.SIGN_TRANSACTION,
      payload: signedData,
    }),
    
    receiveTransaction: (transactionData) => dispatch({
      type: ActionTypes.RECEIVE_TRANSACTION,
      payload: transactionData,
    }),
    
    finalizeTransaction: () => dispatch({ type: ActionTypes.FINALIZE_TRANSACTION }),
    
    broadcastTransaction: (id, signature) => dispatch({
      type: ActionTypes.BROADCAST_TRANSACTION,
      payload: { id, signature },
    }),
    
    clearCurrentTransaction: () => dispatch({ type: ActionTypes.CLEAR_CURRENT_TRANSACTION }),
    
    setNFCStatus: (enabled, supported) => dispatch({
      type: ActionTypes.SET_NFC_STATUS,
      payload: { enabled, supported },
    }),
  };

  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
};

// Hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};