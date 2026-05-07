import React, { createContext, useContext, useReducer, ReactNode } from 'react';

/**
 * 應用角色類型
 */
export type AppRole = 'broadcaster' | 'viewer' | null;

/**
 * 應用狀態
 */
export interface AppState {
  role: AppRole;
  disclaimerAccepted: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * 應用狀態動作
 */
export type AppAction =
  | { type: 'SET_ROLE'; payload: AppRole }
  | { type: 'ACCEPT_DISCLAIMER' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' };

/**
 * 初始狀態
 */
const initialState: AppState = {
  role: null,
  disclaimerAccepted: false,
  isLoading: false,
  error: null,
};

/**
 * 狀態減速器
 */
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_ROLE':
      return { ...state, role: action.payload };
    case 'ACCEPT_DISCLAIMER':
      return { ...state, disclaimerAccepted: true };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

/**
 * 應用 Context
 */
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * 應用 Provider 組件
 */
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

/**
 * 使用應用狀態 Hook
 */
export function useAppState() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within AppProvider');
  }
  return context;
}
