import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
    isAuthenticated: boolean;
    login: () => void;
    logout: () => void;
    user: { name: string; email: string; role: string } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);

    useEffect(() => {
        const storedAuth = localStorage.getItem('isAuthenticated');
        if (storedAuth === 'true') {
            setIsAuthenticated(true);
            setUser({
                name: 'John Doe',
                email: 'john.doe@example.com',
                role: 'Auditor Principal'
            });
        }
    }, []);

    const login = () => {
        localStorage.setItem('isAuthenticated', 'true');
        setIsAuthenticated(true);
        setUser({
            name: 'John Doe',
            email: 'john.doe@example.com',
            role: 'Auditor Principal'
        });
    };

    const logout = () => {
        localStorage.removeItem('isAuthenticated');
        setIsAuthenticated(false);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout, user }}>
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
