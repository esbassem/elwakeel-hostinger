
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const useGuarantorDetails = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getGuarantorAccount = useCallback(async (accountId) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', accountId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching guarantor account:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateGuarantorAccount = useCallback(async (accountId, updates) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('accounts')
        .update(updates)
        .eq('id', accountId)
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "تم التحديث",
        description: "تم تحديث بيانات حساب الضامن بنجاح",
        className: "bg-green-50 border-green-200"
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error updating guarantor account:', error);
      toast({
        title: "خطأ",
        description: "فشل تحديث بيانات الحساب",
        variant: "destructive"
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateGuaranteeInfo = useCallback(async (guaranteeId, updates) => {
    if (!guaranteeId) return { error: "No guarantee ID provided" };
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('guarantees')
        .update(updates)
        .eq('id', guaranteeId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: "تم تحديث بيانات الضمان بنجاح"
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error updating guarantee info:', error);
      toast({
        title: "خطأ",
        description: "فشل تحديث بيانات الضمان",
        variant: "destructive"
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    loading,
    getGuarantorAccount,
    updateGuarantorAccount,
    updateGuaranteeInfo
  };
};
