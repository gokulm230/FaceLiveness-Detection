import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { toast } from 'react-toastify';
import { authService } from '../services/api';

// Initial state
const initialState = {
  isAuthenticated: false,
  user: null,
  session: null,
  loading: false,
  error: null,
  authToken: null
};

// Action types
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_SESSION: 'SET_SESSION',
  SET_USER: 'SET_USER',
  SET_AUTH_TOKEN: 'SET_AUTH_TOKEN',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
        error: action.payload ? null : state.error
      };

    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };

    case ActionTypes.SET_SESSION:
      return {
        ...state,
        session: action.payload,
        loading: false,
        error: null
      };

    case ActionTypes.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        loading: false,
        error: null
      };

    case ActionTypes.SET_AUTH_TOKEN:
      return {
        ...state,
        authToken: action.payload,
        isAuthenticated: !!action.payload,
        loading: false
      };

    case ActionTypes.LOGOUT:
      return {
        ...initialState
      };

    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Start authentication session
  const startSession = useCallback(async (aadhaarNumber) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      dispatch({ type: ActionTypes.CLEAR_ERROR });

      const response = await authService.startSession(aadhaarNumber);
      
      if (response.success) {
        dispatch({ type: ActionTypes.SET_SESSION, payload: response.data });
        toast.success('Authentication session started successfully');
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to start session');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to start authentication session';
      dispatch({ type: ActionTypes.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  // Submit liveness proof
  const submitLivenessProof = useCallback(async (sessionId, images) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      dispatch({ type: ActionTypes.CLEAR_ERROR });

      const response = await authService.submitLivenessProof(sessionId, images);
      
      if (response.success) {
        // Update session with liveness results
        const updatedSession = {
          ...state.session,
          ...response.data,
          livenessVerified: response.data.livenessVerified
        };
        dispatch({ type: ActionTypes.SET_SESSION, payload: updatedSession });
        
        if (response.data.livenessVerified) {
          toast.success('Liveness verification successful');
        } else {
          toast.warning('Liveness verification failed. Please try again.');
        }
        
        return response.data;
      } else {
        throw new Error(response.error || 'Liveness verification failed');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to verify liveness';
      dispatch({ type: ActionTypes.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  }, [state.session]);

  // Complete authentication
  const completeAuthentication = useCallback(async (sessionId, referenceImage) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      dispatch({ type: ActionTypes.CLEAR_ERROR });

      const response = await authService.completeAuthentication(sessionId, referenceImage);
      
      if (response.success) {
        if (response.data.authenticated) {
          dispatch({ type: ActionTypes.SET_AUTH_TOKEN, payload: response.data.authToken });
          dispatch({ type: ActionTypes.SET_USER, payload: {
            sessionId: response.data.sessionId,
            authenticated: true,
            confidence: response.data.confidence,
            validUntil: response.data.validUntil
          }});
          toast.success('Authentication completed successfully');
        } else {
          toast.error('Authentication failed. Please try again.');
        }
        return response.data;
      } else {
        throw new Error(response.error || 'Authentication failed');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to complete authentication';
      dispatch({ type: ActionTypes.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  // Get session status
  const getSessionStatus = useCallback(async (sessionId) => {
    try {
      const response = await authService.getSessionStatus(sessionId);
      
      if (response.success) {
        dispatch({ type: ActionTypes.SET_SESSION, payload: response.data });
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to get session status');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to get session status';
      dispatch({ type: ActionTypes.SET_ERROR, payload: errorMessage });
      console.error(errorMessage);
      throw error;
    }
  }, []);

  // End session
  const endSession = useCallback(async (sessionId) => {
    try {
      await authService.endSession(sessionId);
      dispatch({ type: ActionTypes.LOGOUT });
      toast.info('Session ended');
    } catch (error) {
      console.error('Failed to end session:', error);
      // Still logout locally even if server call fails
      dispatch({ type: ActionTypes.LOGOUT });
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      if (state.session?.sessionId) {
        await endSession(state.session.sessionId);
      } else {
        dispatch({ type: ActionTypes.LOGOUT });
        toast.info('Logged out successfully');
      }
    } catch (error) {
      console.error('Logout error:', error);
      dispatch({ type: ActionTypes.LOGOUT });
    }
  }, [state.session, endSession]);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  }, []);

  // Check if session is expired
  const isSessionExpired = useCallback(() => {
    if (!state.session?.expiresAt) return false;
    return new Date() > new Date(state.session.expiresAt);
  }, [state.session]);

  // Auto-cleanup expired sessions
  React.useEffect(() => {
    if (state.session && isSessionExpired()) {
      toast.warning('Session expired. Please start a new authentication.');
      dispatch({ type: ActionTypes.LOGOUT });
    }
  }, [state.session, isSessionExpired]);

  const value = {
    // State
    ...state,
    
    // Actions
    startSession,
    submitLivenessProof,
    completeAuthentication,
    getSessionStatus,
    endSession,
    logout,
    clearError,
    
    // Utilities
    isSessionExpired
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
