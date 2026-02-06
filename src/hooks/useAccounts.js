import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const useAccounts = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchAccounts = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      // Select all columns including id_card_image
      let query = supabase
        .from('accounts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,nickname.ilike.%${filters.search}%,phone1.ilike.%${filters.search}%,national_id.ilike.%${filters.search}%`);
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
        title: "خطأ",
        description: "فشل تحميل الحسابات",
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
        .from('accounts')
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
      const { data, error } = await supabase
        .from('accounts')
        .insert([accountData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم إضافة الحساب بنجاح"
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error adding account:', error);
      toast({
        title: "خطأ",
        description: "فشل إضافة الحساب",
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
        .from('accounts')
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

  const deleteAccount = useCallback(async (id, hardDelete = false) => {
    setLoading(true);
    try {
      if (hardDelete) {
        const { error } = await supabase
          .from('accounts')
          .delete()
          .eq('id', id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('accounts')
          .update({ is_active: false })
          .eq('id', id);

        if (error) throw error;
      }

      toast({
        title: "تم بنجاح",
        description: "تم حذف الحساب بنجاح"
      });

      return { error: null };
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "خطأ",
        description: "فشل حذف الحساب",
        variant: "destructive"
      });
      return { error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getMissingFields = useCallback((account) => {
    const requiredFields = [
      { key: 'name', label: 'الاسم' },
      { key: 'phone1', label: 'رقم هاتف 1' },
      { key: 'account_type', label: 'نوع الحساب' }
    ];

    const missing = requiredFields.filter(field => !account[field.key] || account[field.key].trim() === '');
    return missing;
  }, []);

  const uploadIdCardImage = useCallback(async (file, accountId) => {
    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${accountId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('account-id-cards')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('account-id-cards')
        .getPublicUrl(filePath);

      return { url: publicUrl, error: null };
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "خطأ",
        description: "فشل رفع الصورة",
        variant: "destructive"
      });
      return { url: null, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    loading,
    fetchAccounts,
    getAccountById,
    addAccount,
    updateAccount,
    deleteAccount,
    getMissingFields,
    uploadIdCardImage
  };
};