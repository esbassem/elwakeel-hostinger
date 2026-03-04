import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const usePartners = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchPartners = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      // Select all columns including id_card_image
      let query = supabase
        .from('partners')
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
      console.error('Error fetching partners:', error);
      toast({
        title: "خطأ",
        description: "فشل تحميل الشركاء",
        variant: "destructive"
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getPartnerById = useCallback(async (id) => {
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
      console.error('Error fetching partner details:', error);
      toast({
        title: "خطأ",
        description: "فشل تحميل بيانات الشريك",
        variant: "destructive"
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const addPartner = useCallback(async (partnerData) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('partners')
        .insert([partnerData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم إضافة الشريك بنجاح"
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error adding partner:', error);
      toast({
        title: "خطأ",
        description: "فشل إضافة الشريك",
        variant: "destructive"
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updatePartner = useCallback(async (id, partnerData) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('partners')
        .update(partnerData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم تحديث الشريك بنجاح"
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error updating partner:', error);
      toast({
        title: "خطأ",
        description: "فشل تحديث الشريك",
        variant: "destructive"
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const deletePartner = useCallback(async (id, hardDelete = false) => {
    setLoading(true);
    try {
      if (hardDelete) {
        const { error } = await supabase
          .from('partners')
          .delete()
          .eq('id', id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('partners')
          .update({ is_active: false })
          .eq('id', id);

        if (error) throw error;
      }

      toast({
        title: "تم بنجاح",
        description: "تم حذف الشريك بنجاح"
      });

      return { error: null };
    } catch (error) {
      console.error('Error deleting partner:', error);
      toast({
        title: "خطأ",
        description: "فشل حذف الشريك",
        variant: "destructive"
      });
      return { error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getMissingFields = useCallback((partner) => {
    const requiredFields = [
      { key: 'name', label: 'الاسم' },
      { key: 'phone1', label: 'رقم هاتف 1' },
      { key: 'account_type', label: 'نوع الحساب' }
    ];

    const missing = requiredFields.filter(field => !partner[field.key] || partner[field.key].trim() === '');
    return missing;
  }, []);

  const uploadIdCardImage = useCallback(async (file, partnerId) => {
    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${partnerId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('partner-id-cards')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('partner-id-cards')
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
    fetchPartners,
    getPartnerById,
    addPartner,
    updatePartner,
    deletePartner,
    getMissingFields,
    uploadIdCardImage
  };
};
