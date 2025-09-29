import type { ReactNode } from 'react';
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { User, LoginRequest } from '../types/api';
import { apiService } from '../services/api';
import { mockApiService } from '../services/mockApi';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateUser: (user: User) => void;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
};

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'SET_TOKEN'; payload: string };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    case 'SET_TOKEN':
      return {
        ...state,
        token: action.payload,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [useMockApi, setUseMockApi] = React.useState(false);

  // Detect if we should use mock API
  const getApiService = () => {
    return useMockApi ? mockApiService : apiService;
  };

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (token && userStr) {
          const user = JSON.parse(userStr);
          dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });

          // Verify token is still valid by fetching current user
          try {
            const currentUser = await getApiService().getCurrentUser();
            dispatch({ type: 'UPDATE_USER', payload: currentUser });
          } catch (error) {
            // If real API fails, try mock API
            if (!useMockApi) {
              console.log('Real API unavailable, switching to mock API');
              setUseMockApi(true);
              try {
                const currentUser = await mockApiService.getCurrentUser();
                dispatch({ type: 'UPDATE_USER', payload: currentUser });
                return;
              } catch (mockError) {
                console.error('Mock API also failed:', mockError);
              }
            }

            // Token is invalid or APIs unavailable, clear storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            dispatch({ type: 'LOGOUT' });
          }
        } else {
          // Try to determine if backend is available
          try {
            await apiService.getCurrentUser();
          } catch (error) {
            console.log('Backend unavailable, using mock API for demo');
            if (!useMockApi) {
              setUseMockApi(true);
            }
          }
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (!useMockApi) {
          setUseMockApi(true); // Fallback to mock API
        }
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []); // Remove useMockApi dependency to prevent infinite loop

  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await getApiService().login(credentials);

      // Store in localStorage
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.user,
          token: response.token,
        },
      });
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await getApiService().logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      dispatch({ type: 'LOGOUT' });
    }
  };

  const refreshToken = async (): Promise<void> => {
    try {
      const response = await getApiService().refreshToken();
      localStorage.setItem('token', response.token);
      dispatch({ type: 'SET_TOKEN', payload: response.token });
    } catch (error) {
      console.error('Error refreshing token:', error);
      logout();
    }
  };

  const updateUser = (user: User): void => {
    localStorage.setItem('user', JSON.stringify(user));
    dispatch({ type: 'UPDATE_USER', payload: user });
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    refreshToken,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
