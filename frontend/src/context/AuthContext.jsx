import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        try {
          const response = await authService.getMe(storedToken);
          if (response.success) {
            setUser(response.user);
            setToken(storedToken);
          } else {
            localStorage.removeItem('authToken');
            setToken(null);
          }
        } catch (error) {
          localStorage.removeItem('authToken');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    const response = await authService.login(username, password);
    if (response.success && response.token) {
      localStorage.setItem('authToken', response.token);
      setToken(response.token);
      const meResponse = await authService.getMe(response.token);
      if (meResponse.success) {
        setUser(meResponse.user);
      }
      return { success: true };
    }
    return { success: false, message: response.message };
  };

  const register = async (username, email, password) => {
    const response = await authService.register(username, email, password);
    if (response.success && response.token) {
      localStorage.setItem('authToken', response.token);
      setToken(response.token);
      const meResponse = await authService.getMe(response.token);
      if (meResponse.success) {
        setUser(meResponse.user);
      }
      return { success: true };
    }
    return { success: false, message: response.message };
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
