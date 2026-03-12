import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient'; // Reverted to the original, correct import path
import { useToast } from '@/components/ui/use-toast';

export const useAccounts = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchAccounts = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      let query = supabase
        .from('partners')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (filters.search) {
        // The actual original bug fix: removed nickname from the search query
        query = query.or(`name.ilike.%${filters.search}%,phone1.ilike.%${filters.search}%,national_id.ilike.%${filters.search}%`);
      }

      if (filters.account_type) {
        query = query.eq('account_type', filters.account_type);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast({
        title: "خطأ في البحث",
        description: "فشل تحميل بيانات العملاء عند البحث.",
        variant: "destructive"
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getAccountById = useCallback(async (id) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching account details:', error);
      toast({
        title: "خطأ",
        description: "فشل تحميل بيانات الحساب",
        variant: "destructive"
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const addAccount = useCallback(async (accountData) => {
    setLoading(true);
    try {
      // Reverted to the original .select().single() which the component expects
      const { data, error } = await supabase
        .from('partners')
        .insert([accountData])
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error adding account:', error);
      toast({
        title: "خطأ في الإضافة",
        description: `فشلت عملية إضافة العميل: ${error.message}`,
        variant: "destructive"
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateAccount = useCallback(async (id, accountData) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('partners') 
        .update(accountData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم تحديث الحساب بنجاح"
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error updating account:', error);
      toast({
        title: "خطأ",
        description: "فشل تحديث الحساب",
        variant: "destructive"
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // ... other functions from the original file like delete, etc.

  return {
    loading,
    fetchAccounts,
    getAccountById,
    addAccount,
    updateAccount,
  };
};