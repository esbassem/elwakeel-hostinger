import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const useFinance = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getFinances = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      let query = supabase
        .from('finance_contracts')
        .select(`
          *,
          accounts:beneficiary_account_id (*),
          finance_installments (*)
        `)
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.search) {
        query = query.ilike('finance_name', `%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching finances:', error);
      toast({
        title: "خطأ",
        description: "فشل تحميل بيانات التمويل",
        variant: "destructive"
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getPendingFinances = useCallback(async () => {
    return getFinances({ status: 'pending' });
  }, [getFinances]);

  const getApprovedFinancesByMonth = useCallback(async (searchQuery = '') => {
    setLoading(true);
    try {
      let query = supabase
        .from('finance_contracts')
        .select(`
          *,
          accounts:beneficiary_account_id (*),
          finance_installments (*),
          finance_installment_payments (*)
        `)
        .in('status', ['approved', 'completed'])
        .order('finance_date', { ascending: false });

      if (searchQuery) {
        query = query.ilike('finance_name', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const grouped = data.reduce((acc, finance) => {
        const date = new Date(finance.finance_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleString('ar-LY', { month: 'long', year: 'numeric' });

        if (!acc[monthKey]) {
          acc[monthKey] = {
            monthKey,
            monthName,
            finances: [],
            stats: { total: 0, count: 0 }
          };
        }

        const installments = finance.finance_installments || [];
        const payments = finance.finance_installment_payments || [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const totalPaid = payments.reduce((sum, p) => sum + (Number(p.paid_amount) || 0), 0);
        const totalAmount = finance.finance_amount;

        const expectedPaid = installments.reduce((sum, inst) => {
          const d = new Date(inst.installment_date);
          d.setHours(0, 0, 0, 0);
          if (d <= today) {
            return sum + (Number(inst.installment_amount) || 0);
          }
          return sum;
        }, 0);

        const overdueAmount = Math.max(0, expectedPaid - totalPaid);
        const totalRemaining = Math.max(0, totalAmount - totalPaid);
        const sortedInstallments = [...installments].sort((a, b) => new Date(a.installment_date) - new Date(b.installment_date));

        let remainingCash = totalPaid;
        let paidCount = 0;
        let overdueCountInst = 0;
        let firstUnpaidIndex = -1;

        sortedInstallments.forEach((inst, index) => {
            const amount = Number(inst.installment_amount) || 0;
            const paidForThis = Math.min(remainingCash, amount);
            remainingCash = Math.max(0, remainingCash - paidForThis);
            const isFullyPaid = (amount - paidForThis) < 1.0;
            if (isFullyPaid) {
                paidCount++;
            } else {
                if (firstUnpaidIndex === -1) firstUnpaidIndex = index;
                const d = new Date(inst.installment_date);
                d.setHours(0, 0, 0, 0);
                if (d <= today) {
                    overdueCountInst++;
                }
            }
        });

        const metrics = {
            totalAmount, totalPaid, expectedPaid, overdueAmount, totalRemaining, paidCount,
            overdueCountInst, totalInstallmentsCount: sortedInstallments.length,
        };

        const financeWithMetrics = {
            ...finance,
            metrics,
            installments: sortedInstallments,
        };

        acc[monthKey].finances.push(financeWithMetrics);
        acc[monthKey].stats.total += totalAmount;
        acc[monthKey].stats.count += 1;

        return acc;
      }, {});

      return { data: grouped, error: null };

    } catch (error) {
      console.error('Error grouping finances:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getFinanceById = useCallback(async (id) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('finance_contracts')
        .select(`
          *,
          accounts:beneficiary_account_id (*),
          finance_installments (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (data.finance_installments) {
        data.finance_installments.sort((a, b) => a.installment_number - b.installment_number);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching finance details:', error);
      toast({
        title: "خطأ",
        description: "فشل تحميل تفاصيل التمويل",
        variant: "destructive"
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getFinancePayments = useCallback(async (financeId) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('finance_installment_payments')
        .select(`
          *,
          finance_installments!inner (
            finance_id,
            installment_number,
            installment_label
          )
        `)
        .eq('finance_installments.finance_id', financeId)
        .order('payment_date', { ascending: false });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
       console.error('Error fetching payments:', error);
       toast({
        title: "خطأ",
        description: "فشل تحميل سجل الدفعات",
        variant: "destructive"
       });
       return { data: null, error };
    } finally {
       setLoading(false);
    }
  }, [toast]);

  // Updated to handle linking guarantors
  const createFinanceWithGuarantees = useCallback(async (
    financeData, 
    installmentsData, 
    guarantorsData, 
    receiptsData, 
    agreementsData, 
    user
  ) => {
    setLoading(true);
    try {
      // 1. Create Finance Contract
      const { data: contract, error: contractError } = await supabase
        .from('finance_contracts')
        .insert([{
          ...financeData,
          created_by: user.name || user.username,
          created_at: new Date().toISOString(),
          status: 'pending'
        }])
        .select('*, accounts:beneficiary_account_id(*)')
        .single();

      if (contractError) throw contractError;
      const financeId = contract.id;

      // 2. Insert Installments
      if (installmentsData?.length > 0) {
        const installmentsWithId = installmentsData.map(inst => ({
          ...inst,
          finance_id: financeId,
          status: 'unpaid',
          total_paid_amount: 0
        }));

        const { error: installmentsError } = await supabase
          .from('finance_installments')
          .insert(installmentsWithId);

        if (installmentsError) throw installmentsError;
      }

      // 3. Insert Guarantors (linked to accounts)
      if (guarantorsData?.length > 0) {
        const guaranteesWithId = guarantorsData.map(g => ({
          finance_contract_id: financeId,
          guarantee_type: 'personal',
          status: 'active',
          guarantor_account_id: g.guarantor_account_id,
          relationship: g.relationship,
          note: g.note,
          created_at: new Date().toISOString()
        })).filter(g => g.guarantor_account_id); // Ensure we only add if account is selected

        if (guaranteesWithId.length > 0) {
          const { error: guarantorError } = await supabase
            .from('guarantees')
            .insert(guaranteesWithId);

          if (guarantorError) throw guarantorError;
        }
      }

      // 4. Insert Receipt Guarantees (Simplified for new schema)
      if (receiptsData && receiptsData.count > 0) {
        // Create a parent guarantee record
        // Note: New schema doesn't have id_card_front/back. We just create the container.
        const { data: receiptGuaranteeParent, error: parentError } = await supabase
          .from('guarantees')
          .insert({
             finance_contract_id: financeId,
             guarantee_type: 'receipts_bundle',
             status: 'active',
             note: 'حزمة إيصالات أمانة',
             created_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (parentError) throw parentError;

        // Insert individual receipt items
        const validNames = receiptsData.names.filter(n => !!n);
        if (validNames.length > 0) {
           const receiptsWithId = validNames.map(name => ({
             guarantee_id: receiptGuaranteeParent.id,
             receipt_name: name,
             created_at: new Date().toISOString()
           }));

           const { error: receiptsError } = await supabase
             .from('receipt_guarantees')
             .insert(receiptsWithId);

           if (receiptsError) throw receiptsError;
        }
      }

      // 5. Insert Agreement Contracts
      if (agreementsData?.length > 0) {
         const agreementsWithId = agreementsData.map(a => ({
            finance_id: financeId,
            contract_name: a.title || a.name || 'عقد',
            contract_image_url: a.imageUrl || a.image,
            created_at: new Date().toISOString()
         }));

         const { error: agreementsError } = await supabase
            .from('finance_agreements')
            .insert(agreementsWithId);
            
         if (agreementsError) throw agreementsError;
      }

      toast({
        title: "تم بنجاح",
        description: "تم إنشاء ملف التمويل بنجاح",
        className: "bg-green-50 border-green-200"
      });

      return { data: contract, error: null };
    } catch (error) {
      console.error('Error creating finance with guarantees:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل إنشاء التمويل",
        variant: "destructive"
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Add Guarantor to existing Finance
  const addGuarantor = useCallback(async ({ finance_id, guarantor_account_id, relationship, note }) => {
    try {
       const { data, error } = await supabase
          .from('guarantees')
          .insert([{
             finance_contract_id: finance_id,
             guarantor_account_id,
             relationship,
             note,
             guarantee_type: 'personal',
             status: 'active',
             created_at: new Date().toISOString()
          }])
          .select()
          .single();

       if (error) throw error;
       toast({
          title: "تم الإضافة",
          description: "تم إضافة الضامن بنجاح",
          className: "bg-green-50 border-green-200"
       });
       return { data, error: null };
    } catch (error) {
       console.error("Error adding guarantor:", error);
       toast({
          title: "خطأ",
          description: "فشل إضافة الضامن",
          variant: "destructive"
       });
       return { data: null, error };
    }
  }, [toast]);

  // Update Guarantor
  const updateGuarantor = useCallback(async (id, { relationship, note }) => {
     try {
        const { error } = await supabase
           .from('guarantees')
           .update({ relationship, note, updated_at: new Date().toISOString() })
           .eq('id', id);

        if (error) throw error;
        toast({ title: "تم التحديث", description: "تم تحديث بيانات الضمان" });
        return { error: null };
     } catch (error) {
        toast({ title: "خطأ", description: "فشل التحديث", variant: "destructive" });
        return { error };
     }
  }, [toast]);

  // Delete Guarantor
  const deleteGuarantor = useCallback(async (id) => {
     try {
        const { error } = await supabase.from('guarantees').delete().eq('id', id);
        if (error) throw error;
        toast({ title: "تم الحذف", description: "تم حذف الضامن من التمويل" });
        return { error: null };
     } catch (error) {
        toast({ title: "خطأ", description: "فشل الحذف", variant: "destructive" });
        return { error };
     }
  }, [toast]);

  const updateFinanceStatus = useCallback(async (id, status, user, reason = null) => {
    setLoading(true);
    try {
      const updateData = {
        status,
        ...(status === 'approved' ? { 
          approved_by: user.name || user.username, 
          approved_at: new Date().toISOString() 
        } : {}),
        ...(status === 'rejected' ? { rejected_reason: reason } : {})
      };

      const { data, error } = await supabase
        .from('finance_contracts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: `تم تغيير حالة التمويل إلى ${status === 'approved' ? 'موافق عليه' : 'مرفوض'}`,
        className: "bg-blue-50 border-blue-200"
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error updating finance status:', error);
      toast({
        title: "خطأ",
        description: "فشل تحديث حالة التمويل",
        variant: "destructive"
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const registerPayment = useCallback(async (installmentId, amount, date, note, user) => {
    setLoading(true);
    try {
      const { data: installment, error: fetchError } = await supabase
        .from('finance_installments')
        .select('*')
        .eq('id', installmentId)
        .single();

      if (fetchError) throw fetchError;

      const newTotalPaid = (Number(installment.total_paid_amount) || 0) + Number(amount);
      const isFullyPaid = newTotalPaid >= Number(installment.installment_amount);
      
      const { error: paymentError } = await supabase
        .from('finance_installment_payments')
        .insert([{
          installment_id: installmentId,
          paid_amount: amount,
          payment_date: date,
          note: note,
          created_by: user.name || user.username
        }]);

      if (paymentError) throw paymentError;

      const { error: updateError } = await supabase
        .from('finance_installments')
        .update({
          total_paid_amount: newTotalPaid,
          status: isFullyPaid ? 'paid' : 'partially_paid',
          paid_at: isFullyPaid ? new Date().toISOString() : null
        })
        .eq('id', installmentId);

      if (updateError) throw updateError;

      if (isFullyPaid) {
        const { data: allInstallments } = await supabase
          .from('finance_installments')
          .select('status')
          .eq('finance_id', installment.finance_id);
        
        const allPaid = allInstallments.every(i => i.status === 'paid');
        
        if (allPaid) {
          await supabase
            .from('finance_contracts')
            .update({ status: 'completed' })
            .eq('id', installment.finance_id);
        }
      }

      toast({
        title: "تم الدفع",
        description: "تم تسجيل الدفعة بنجاح",
        className: "bg-green-50 border-green-200"
      });

      return { error: null };
    } catch (error) {
      console.error('Error registering payment:', error);
      toast({
        title: "خطأ",
        description: "فشل تسجيل الدفعة",
        variant: "destructive"
      });
      return { error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getFinanceNotes = useCallback(async (financeId) => {
    try {
      const { data, error } = await supabase
        .from('finance_notes')
        .select('*')
        .eq('finance_id', financeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching notes:', error);
      return { data: null, error };
    }
  }, []);

  const addFinanceNote = useCallback(async (financeId, noteText, user) => {
    try {
      const { data, error } = await supabase
        .from('finance_notes')
        .insert([{
          finance_id: financeId,
          note_text: noteText,
          created_by: user.name || user.username,
          user_name: user.name || user.username,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "خطأ",
        description: "فشل إضافة الملاحظة",
        variant: "destructive"
      });
      return { data: null, error };
    }
  }, [toast]);

  return {
    loading,
    getFinances,
    getPendingFinances,
    getApprovedFinancesByMonth,
    getFinanceById,
    getFinancePayments,
    createFinanceWithGuarantees,
    updateFinanceStatus,
    registerPayment,
    getFinanceNotes,
    addFinanceNote,
    addGuarantor,
    updateGuarantor,
    deleteGuarantor
  };
};
