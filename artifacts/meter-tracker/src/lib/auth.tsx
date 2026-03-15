import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Role = 'SENDER' | 'RECEIVER' | null;

interface AuthContextType {
  role: Role;
  setRole: (role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(null);

  useEffect(() => {
    const savedRole = localStorage.getItem('app_role') as Role;
    if (savedRole) {
      setRoleState(savedRole);
    }
  }, []);

  const setRole = (newRole: Role) => {
    if (newRole) {
      localStorage.setItem('app_role', newRole);
    } else {
      localStorage.removeItem('app_role');
    }
    setRoleState(newRole);
  };

  const logout = () => {
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ role, setRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
