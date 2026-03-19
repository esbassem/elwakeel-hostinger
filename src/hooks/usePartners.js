import { useState, useCallback } from 'react';
import { supabase } from '../lib/customSupabaseClient';
import { useToast } from '../components/ui/use-toast';

const BUCKET_NAME = 'account-id-cards';

export const usePartners = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const uploadIdCard = async (partnerId, file, type) => {
    if (!file || !(file instanceof File)) {
      return { url: null, error: null };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${partnerId}-${type}-${Date.now()}.${fileExt}`;
    const filePath = `public/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
      });

    if (uploadError) {
      console.error(`Error uploading ${type} card:`, uploadError);
      return { url: null, error: uploadError };
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    if (!publicUrlData.publicUrl) {
         console.error('Error getting public URL for ' + filePath);
         return { url: null, error: { message: 'Error getting public URL' }};
    }

    return { url: publicUrlData.publicUrl, error: null };
  };
  
  const addPartner = useCallback(async (partnerData) => {
    setLoading(true);
    try {
      const { id_card_front, id_card_back, ...restData } = partnerData;
      
      // Remove any extraneous properties before insert
      const { id, created_at, ...insertData } = restData;

      const { data: newPartner, error: insertError } = await supabase
        .from('partners')
        .insert(insertData)
        .select()
        .single();

      if (insertError) throw insertError;

      let frontUrl = null;
      let backUrl = null;
      let hasUploadError = false;

      if (id_card_front instanceof File) {
        const { url, error } = await uploadIdCard(newPartner.id, id_card_front, 'front');
        if (error) hasUploadError = true;
        frontUrl = url;
      }
      if (id_card_back instanceof File) {
        const { url, error } = await uploadIdCard(newPartner.id, id_card_back, 'back');
        if (error) hasUploadError = true;
        backUrl = url;
      }
      
      const imageUpdates = {};
      if (frontUrl) imageUpdates.id_card_front = frontUrl;
      if (backUrl) imageUpdates.id_card_back = backUrl;

      if (Object.keys(imageUpdates).length > 0) {
        const { data: updatedPartner, error: updateError } = await supabase
          .from('partners')
          .update(imageUpdates)
          .eq('id', newPartner.id)
          .select()
          .single();

        if (updateError) throw updateError;
        
        toast({ title: 'نجاح', description: 'تم إنشاء الشريك بنجاح.' });
        if (hasUploadError) {
          toast({ title: 'تنبيه', description: 'تم إنشاء الشريك ولكن فشل تحميل صورة واحدة أو أكثر من صور البطاقة.', variant: 'destructive' });
        }
        return updatedPartner;
      }
      
      toast({ title: 'نجاح', description: 'تم إنشاء الشريك بنجاح.' });
      return newPartner;

    } catch (error) {
      console.error('Error adding partner:', error);
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updatePartner = useCallback(async (id, partnerData) => {
    setLoading(true);
    try {
      const { id_card_front, id_card_back, ...restData } = partnerData;
      
      // Exclude fields that should not be in the update payload
      const { id: partnerId, created_at, ...updateData } = restData;
      
      const updates = { ...updateData };
      let hasUploadError = false;

      if (id_card_front instanceof File) {
        const { url, error } = await uploadIdCard(id, id_card_front, 'front');
        if (error) hasUploadError = true; else updates.id_card_front = url;
      }
      if (id_card_back instanceof File) {
         const { url, error } = await uploadIdCard(id, id_card_back, 'back');
        if (error) hasUploadError = true; else updates.id_card_back = url;
      }

      const { data: updatedPartner, error } = await supabase
        .from('partners')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      toast({ title: 'نجاح', description: 'تم تحديث بيانات الشريك بنجاح.' });
      if (hasUploadError) {
        toast({ title: 'تنبيه', description: 'تم تحديث الشريك ولكن فشل تحميل صورة واحدة أو أكثر من صور البطاقة.', variant: 'destructive' });
      }

      return updatedPartner;
    } catch (error) {
      console.error('Error updating partner:', error);
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
      return null;
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
      return data;
    } catch (error) {
      console.error('Error fetching partner:', error);
      toast({ title: 'خطأ', description: 'فشل في جلب بيانات الشريك.', variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const searchPartners = useCallback(async ({ query }) => {
    setLoading(true);
    try {
        let queryBuilder = supabase.from('partners').select('*');
        if (query) {
            queryBuilder = queryBuilder.or(`name.ilike.%${query}%,nickname.ilike.%${query}%,phone1.ilike.%${query}%,national_id.ilike.%${query}%`);
        }
        const { data, error } = await queryBuilder;
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error searching partners:', error);
        toast({ title: 'خطأ', description: 'فشل البحث عن الشركاء.', variant: 'destructive' });
        return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { loading, addPartner, updatePartner, getPartnerById, searchPartners };
};
