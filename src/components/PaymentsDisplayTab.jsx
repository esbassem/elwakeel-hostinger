
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const PaymentsDisplayTab = ({ finance_id }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!finance_id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('finance_installment_payments')
        .select('*, finance_installments(installment_number, installment_label)')
        .eq('finance_id', finance_id)
        .order('payment_date', { ascending: false });

      if (error) {
        console.error('Error fetching payments:', error);
      } else {
        setPayments(data);
      }
      setLoading(false);
    };

    fetchPayments();
  }, [finance_id]);

  if (loading) {
    return <div className="text-center py-12">جارٍ تحميل المدفوعات...</div>;
  }

  return (
    <Card className="shadow-none border bg-white relative overflow-hidden pt-9">
       <div className="absolute top-0 right-0 bg-slate-100 text-slate-800 font-semibold text-xs py-1.5 px-4 rounded-bl-lg">
        المدفوعات
      </div>
      <CardContent className="p-0">
        <ScrollArea className="h-[354px] w-full">
            {payments.length > 0 ? (
                <div className="divide-y divide-slate-100" dir="rtl">
                    {payments.map((payment) => (
                    <div key={payment.id} className="p-3 flex justify-between items-start hover:bg-slate-50/50">
                        <div className="text-right">
                            <div className="font-bold text-slate-800 text-sm">
                                {Number(payment.paid_amount).toLocaleString('en-US')}
                            </div>
                            <div className="text-xs text-slate-500 mt-1 flex items-center justify-end">
                                <span className="font-mono text-[11px] text-slate-400">
                                    {new Date(payment.payment_date).toLocaleDateString('en-GB')}
                                </span>
                            </div>
                        </div>
                        <div className="text-left flex-1 ml-4">
                             <div className="font-medium text-xs text-slate-800">
                                {payment.finance_installments 
                                ? `دفعة لـ ${payment.finance_installments.installment_label || `القسط ${payment.finance_installments.installment_number}`}`
                                : 'دفعة عامة'}
                            </div>
                            {payment.note && <p className="text-[11px] text-slate-600 mt-1 italic">{payment.note}</p>}
                        </div>
                    </div>
                    ))}
                </div>
             ) : (
                <div className="text-center py-12 text-slate-500 text-sm">لا توجد مدفوعات لعرضها.</div>
            )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default PaymentsDisplayTab;
