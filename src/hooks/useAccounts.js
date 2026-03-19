
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
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
      const dataToInsert = { ...accountData };

      const uploadFile = async (file, fieldName) => {
        if (!file || typeof file !== 'object') return null;

        const bucket = 'account-id-cards'; // CORRECTED: Using the user-provided bucket name.
        const fileExt = file.name.split('.').pop();
        const path = `public/${accountData.phone1 || 'unknown'}/${fieldName}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(path, file);

        if (uploadError) {
            throw new Error(`فشل رفع صورة البطاقة: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);

        return urlData.publicUrl;
      };

      if (dataToInsert.id_card_front && typeof dataToInsert.id_card_front === 'object') {
          dataToInsert.id_card_front = await uploadFile(dataToInsert.id_card_front, 'id-front');
      }

      if (dataToInsert.id_card_back && typeof dataToInsert.id_card_back === 'object') {
          dataToInsert.id_card_back = await uploadFile(dataToInsert.id_card_back, 'id-back');
      }

      const { data, error } = await supabase
        .from('partners')
        .insert([dataToInsert])
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

        const dataToUpdate = { ...accountData };

        const uploadFile = async (file, fieldName) => {
            if (!file || typeof file !== 'object') return null;
    
            const bucket = 'account-id-cards';
            const fileExt = file.name.split('.').pop();
            const path = `public/${dataToUpdate.phone1 || 'unknown'}/${fieldName}-${Date.now()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file);
    
            if (uploadError) throw new Error(`فشل رفع صورة البطاقة: ${uploadError.message}`);

            const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
    
            return urlData.publicUrl;
        };

        if (dataToUpdate.id_card_front && typeof dataToUpdate.id_card_front === 'object') {
            dataToUpdate.id_card_front = await uploadFile(dataToUpdate.id_card_front, 'id-front-update');
        }

        if (dataToUpdate.id_card_back && typeof dataToUpdate.id_card_back === 'object') {
            dataToUpdate.id_card_back = await uploadFile(dataToUpdate.id_card_back, 'id-back-update');
        }


      const { data, error } = await supabase
        .from('partners') 
        .update(dataToUpdate)
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
        description: `فشل تحديث الحساب: ${error.message}`,
        variant: "destructive"
      });
      return { data: null, error };
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
  };
};
