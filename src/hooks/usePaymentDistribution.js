
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const usePaymentDistribution = (financeId, rawInstallments = [], refreshTrigger = 0) => {
  const [distributedInstallments, setDistributedInstallments] = useState([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);

  const fetchPaymentsAndCalculate = useCallback(async () => {
    if (!financeId) return;
    
    setLoading(true);
    try {
      // 1. Fetch all payments for this finance contract
      const { data: paymentsData, error } = await supabase
        .from('finance_installment_payments')
        .select('*')
        .eq('finance_id', financeId);

      if (error) throw error;

      setPayments(paymentsData || []);

      // 2. Calculate Total Cash Available
      const totalCash = (paymentsData || []).reduce((sum, p) => sum + Number(p.paid_amount), 0);
      setTotalPaid(totalCash);

      // 3. Sort installments by date (Oldest first)
      // Ensure we work with a copy to avoid mutating props
      const sortedInstallments = [...rawInstallments].sort((a, b) => 
        new Date(a.installment_date) - new Date(b.installment_date)
      );

      // 4. Distribute Cash (Waterfall Method)
      let remainingCash = totalCash;

      const calculated = sortedInstallments.map(inst => {
        const amountNeeded = Number(inst.installment_amount);
        const amountAllocated = Math.min(remainingCash, amountNeeded);
        
        remainingCash = Math.max(0, remainingCash - amountAllocated);

        // Determine Status based on allocation
        let status = 'pending';
        if (amountAllocated >= amountNeeded - 0.01) { // Tolerance for float precision
          status = 'paid';
        } else if (amountAllocated > 0) {
          status = 'partially_paid';
        } else {
            // Check if overdue
            const today = new Date();
            today.setHours(0,0,0,0);
            const dueDate = new Date(inst.installment_date);
            if(dueDate < today) status = 'overdue';
        }

        return {
          ...inst,
          calculated_paid_amount: amountAllocated,
          calculated_remaining_amount: amountNeeded - amountAllocated,
          calculated_status: status,
          is_fully_paid: status === 'paid'
        };
      });

      setDistributedInstallments(calculated);

    } catch (error) {
      console.error('Error calculating distribution:', error);
    } finally {
      setLoading(false);
    }
  }, [financeId, rawInstallments, refreshTrigger]);

  useEffect(() => {
    fetchPaymentsAndCalculate();
  }, [fetchPaymentsAndCalculate]);

  return {
    distributedInstallments,
    totalPaid,
    loading,
    payments,
    refreshDistribution: fetchPaymentsAndCalculate
  };
};
