
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const useFinanceTotals = (financeId, installments = [], totalAmount = 0) => {
  const [totals, setTotals] = useState({
    total: 0,
    paid: 0,
    remaining: 0,
    loading: true
  });

  // Calculate total from installments if available, otherwise use provided totalAmount
  const calculatedTotal = useMemo(() => {
    if (Array.isArray(installments) && installments.length > 0) {
      return installments.reduce((sum, inst) => sum + (Number(inst.amount || inst.installment_amount || inst.value) || 0), 0);
    }
    return Number(totalAmount) || 0;
  }, [installments, totalAmount]);

  useEffect(() => {
    let isMounted = true;

    const fetchTotals = async () => {
      if (!financeId) {
        if (isMounted) {
          setTotals(prev => ({ ...prev, total: calculatedTotal, loading: false }));
        }
        return;
      }

      try {
        setTotals(prev => ({ ...prev, loading: true }));

        const { data, error } = await supabase
          .from('finance_installment_payments')
          .select('paid_amount')
          .eq('finance_id', financeId);

        if (error) throw error;

        const totalPaid = (data || []).reduce((sum, record) => sum + (Number(record.paid_amount) || 0), 0);
        const remaining = Math.max(0, calculatedTotal - totalPaid);

        if (isMounted) {
          setTotals({
            total: calculatedTotal,
            paid: totalPaid,
            remaining: remaining,
            loading: false
          });
        }
      } catch (err) {
        console.error('Error fetching finance totals:', err);
        if (isMounted) {
          setTotals(prev => ({ 
            ...prev, 
            total: calculatedTotal, 
            remaining: Math.max(0, calculatedTotal - prev.paid),
            loading: false 
          }));
        }
      }
    };

    fetchTotals();

    return () => {
      isMounted = false;
    };
  }, [financeId, calculatedTotal]);

  return totals;
};
