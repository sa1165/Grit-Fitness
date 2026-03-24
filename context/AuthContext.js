import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Logger } from '../utils/Logger';

const AuthContext = createContext({
    session: null,
    user: null,
    profile: null,
    isLoading: true,
    signOut: () => { },
    refreshProfile: () => { },
});

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        Logger.info('AuthContext', 'Initializing Auth state...');

        // Check for existing session on mount
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) {
                Logger.error('AuthContext', 'Error getting session', error);
                setIsLoading(false);
            } else {
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                    fetchProfile(session.user.id);
                } else {
                    setIsLoading(false);
                }
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            Logger.debug('AuthContext', `Auth state change: ${_event}`, { userId: session?.user?.id });
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setProfile(null);
                setIsLoading(false);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                Logger.error('AuthContext', 'Error fetching profile', error);
            } else {
                setProfile(data);
            }
        } catch (err) {
            Logger.error('AuthContext', 'Unexpected error fetching profile', err);
        } finally {
            setIsLoading(false);
        }
    };

    const signOut = async () => {
        Logger.info('AuthContext', 'Signing out user...');
        const { error } = await supabase.auth.signOut();
        if (error) {
            Logger.error('AuthContext', 'Error signing out', error);
        }
        setProfile(null);
    };

    return (
        <AuthContext.Provider value={{ session, user, profile, isLoading, signOut, refreshProfile: () => user && fetchProfile(user.id) }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
