
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appRole, setAppRole] = useState(null); // New state for application specific role

  const handleSession = useCallback(async (session) => {
    setSession(session);
    const sessionUser = session?.user ?? null;
    setUser(sessionUser);

    // If we have a session user, try to fetch their role from app_users
    // This connects Supabase Auth identity with our custom role system
    if (sessionUser?.email) {
       const { data: userData, error } = await supabase
          .from('app_users')
          .select('role')
          .eq('email', sessionUser.email)
          .maybeSingle(); // Use maybeSingle to avoid errors if not found
       
       if (userData) {
          setAppRole(userData.role);
          // Enhance the user object with the role for convenience
          sessionUser.role = userData.role; 
          setUser({...sessionUser});
       }
    } else {
       setAppRole(null);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      handleSession(session);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        handleSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, [handleSession]);

  const signUp = useCallback(async (email, password, options) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign up Failed",
        description: error.message || "Something went wrong",
      });
    }

    return { error };
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign in Failed",
        description: error.message || "Something went wrong",
      });
    }

    return { error };
  }, [toast]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign out Failed",
        description: error.message || "Something went wrong",
      });
    }

    return { error };
  }, [toast]);

  // Include appRole in the context value
  const value = useMemo(() => ({
    user,
    session,
    loading,
    appRole, 
    signUp,
    signIn,
    signOut,
  }), [user, session, loading, appRole, signUp, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useSupabaseAuth = useAuth;
