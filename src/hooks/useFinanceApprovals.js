
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const useFinanceApprovals = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchPendingApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('finance_contracts')
        .select(`
          *,
          accounts:beneficiary_account_id (name, nickname, phone1),
          finance_installments (installment_amount)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      toast({
        title: "خطأ",
        description: "فشل تحميل طلبات الموافقة المعلقة",
        variant: "destructive"
      });
      return { data: [], error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const approvePendingFinance = useCallback(async (financeId, user) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('finance_contracts')
        .update({
          status: 'approved',
          approved_by: user.name || user.username,
          approved_at: new Date().toISOString()
        })
        .eq('id', financeId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "تمت الموافقة",
        description: "تم اعتماد التمويل بنجاح",
        className: "bg-green-50 border-green-200"
      });

      return { success: true, data };
    } catch (error) {
      console.error('Error approving finance:', error);
      toast({
        title: "خطأ",
        description: "فشل اعتماد التمويل",
        variant: "destructive"
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const rejectPendingFinance = useCallback(async (financeId, reason, user) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('finance_contracts')
        .update({
          status: 'rejected',
          rejected_reason: reason,
          approved_by: user.name || user.username, // Track who rejected it too
          approved_at: new Date().toISOString() // Track when
        })
        .eq('id', financeId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "تم الرفض",
        description: "تم رفض التمويل",
        className: "bg-red-50 border-red-200"
      });

      return { success: true, data };
    } catch (error) {
      console.error('Error rejecting finance:', error);
      toast({
        title: "خطأ",
        description: "فشل رفض التمويل",
        variant: "destructive"
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    loading,
    fetchPendingApprovals,
    approvePendingFinance,
    rejectPendingFinance
  };
};
