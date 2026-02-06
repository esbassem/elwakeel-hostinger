
import React, { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { AlertCircle, CreditCard } from 'lucide-react';
import FinanceInstallmentCard from '@/components/FinanceInstallmentCard';
import { calculateFinanceMetrics } from '@/utils/financeMetrics';

const CollectionInstallmentsList = ({ customerId, onFinanceSelect }) => {
  const [finances, setFinances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFinances = async () => {
    if (!customerId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch contracts - Added status='approved' filter
      const { data, error: fetchError } = await supabase
        .from('finance_contracts')
        .select(`
          *,
          finance_installments (*),
          finance_installment_payments (paid_amount)
        `)
        .eq('beneficiary_account_id', customerId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Process and enrich data using the new metrics utility
      const enrichedData = data.map(finance => {
        const metrics = calculateFinanceMetrics(finance);
        return {
          ...finance,
          metrics
        };
      });

      setFinances(enrichedData);
    } catch (err) {
      console.error("Error fetching finances:", err);
      setError("تعذر تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinances();
  }, [customerId]);

  if (loading) {
    return (
      <div className="h-full w-full p-4 space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
            <div className="h-2 bg-slate-100 rounded w-full mb-3"></div>
            <div className="h-8 bg-slate-100 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-4 text-center text-slate-500">
        <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
        <p className="text-xs font-medium mb-3">{error}</p>
        <Button onClick={fetchFinances} variant="outline" size="sm">إعادة المحاولة</Button>
      </div>
    );
  }

  if (finances.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-4 text-center text-slate-400">
        <CreditCard className="w-12 h-12 mb-3 opacity-10" />
        <p className="text-sm font-medium">لا توجد تمويلات نشطة لهذا العميل</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full px-2" dir="rtl">
      <div className="space-y-4 py-2 pb-10">
        {finances.map((finance, index) => (
          <FinanceInstallmentCard
            key={finance.id}
            finance={finance}
            index={index}
            onClick={() => onFinanceSelect && onFinanceSelect(finance.id)}
          />
        ))}
      </div>
    </ScrollArea>
  );
};

export default CollectionInstallmentsList;
