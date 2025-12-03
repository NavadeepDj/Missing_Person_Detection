import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Dummy credentials for testing
const DUMMY_USERS: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@tracevision.com',
    role: 'admin',
    organization: 'TraceVision HQ'
  },
  {
    id: '2',
    name: 'Detective Sarah Johnson',
    email: 'sarah.johnson@police.gov',
    role: 'case_manager',
    organization: 'City Police Department'
  },
  {
    id: '3',
    name: 'Officer Mike Chen',
    email: 'mike.chen@police.gov',
    role: 'investigator',
    organization: 'City Police Department'
  },
  {
    id: '4',
    name: 'NGO Coordinator',
    email: 'coordinator@missingpersons.org',
    role: 'case_manager',
    organization: 'Missing Persons NGO'
  },
  {
    id: '5',
    name: 'Public Citizen',
    email: 'citizen@tracevision.com',
    role: 'citizen',
    organization: 'Community User'
  }
];

const DUMMY_PASSWORDS: Record<string, string> = {
  'admin@tracevision.com': 'admin123',
  'sarah.johnson@police.gov': 'police123',
  'mike.chen@police.gov': 'officer123',
  'coordinator@missingpersons.org': 'ngo123',
  'citizen@tracevision.com': 'citizen123'
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth on mount
    const storedUser = localStorage.getItem('tracevision_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const foundUser = DUMMY_USERS.find(u => u.email === email);
    if (foundUser && DUMMY_PASSWORDS[email] === password) {
      setUser(foundUser);
      localStorage.setItem('tracevision_user', JSON.stringify(foundUser));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('tracevision_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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

export const useAuthContext = useAuth;
