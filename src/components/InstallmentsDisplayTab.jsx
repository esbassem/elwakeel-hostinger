
import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const InstallmentsDisplayTab = ({ finance_id }) => {
  const [installments, setInstallments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!finance_id) return;
      setLoading(true);

      const { data: installmentsData, error: installmentsError } = await supabase
        .from('finance_installments')
        .select('*')
        .eq('finance_id', finance_id)
        .order('installment_number', { ascending: true });

      if (installmentsError) console.error('Error fetching installments:', installmentsError);
      else setInstallments(installmentsData);

      const { data: paymentsData, error: paymentsError } = await supabase
        .from('finance_installment_payments')
        .select('paid_amount')
        .eq('finance_id', finance_id);

      if (paymentsError) console.error('Error fetching payments:', paymentsError);
      else setPayments(paymentsData);

      setLoading(false);
    };

    fetchData();
  }, [finance_id]);

  const processedInstallments = useMemo(() => {
    const totalPaid = payments.reduce((sum, p) => sum + p.paid_amount, 0);
    let remainingPaid = totalPaid;

    return installments.map(inst => {
      const amount = inst.installment_amount;
      let status;

      if (remainingPaid >= amount) {
        status = 'paid';
        remainingPaid -= amount;
      } else if (remainingPaid > 0) {
        status = 'partially_paid';
        remainingPaid = 0;
      } else {
        status = 'unpaid';
      }
      
      return { ...inst, calculated_status: status };
    });
  }, [installments, payments]);


  const getInstallmentDisplayInfo = (installment) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(installment.installment_date);
    dueDate.setHours(0, 0, 0, 0);

    switch (installment.calculated_status) {
      case 'paid':
        return { label: "مدفوع", className: "border-green-300 bg-green-50 text-green-700" };
      case 'partially_paid':
        return { label: "مدفوع جزئياً", className: "border-yellow-300 bg-yellow-50 text-yellow-700" };
      case 'unpaid':
        if (dueDate < today) {
          return { label: "متأخر", className: "border-red-300 bg-red-50 text-red-700" };
        }
        return { label: "قادم", className: "border-slate-300 bg-slate-50 text-slate-500" };
      default:
        return { label: "قادم", className: "border-slate-300 bg-slate-50 text-slate-500" };
    }
  };


  if (loading) {
    return <div className="text-center py-12">جارٍ تحميل الأقساط...</div>;
  }

  return (
    <Card className="shadow-none border bg-white relative overflow-hidden pt-9">
      <div className="absolute top-0 right-0 bg-slate-100 text-slate-800 font-semibold text-xs py-1.5 px-4 rounded-bl-lg">
        الأقساط
      </div>
      <CardContent className="p-0">
        <ScrollArea className="h-[354px] w-full">
            {processedInstallments.length > 0 ? (
                <div className="p-1.5" dir="rtl">
                    {processedInstallments.map((installment) => {
                        const displayInfo = getInstallmentDisplayInfo(installment);
                        return (
                            <div key={installment.id} className="p-2.5 rounded-lg flex items-center justify-between hover:bg-slate-50 transition-colors">
                               <div className="flex-grow flex items-center">
                                    <div className={cn("flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg font-mono text-xs font-semibold", {
                                      "bg-slate-100/80 text-slate-500": displayInfo.label === 'قادم',
                                      "bg-red-100/80 text-red-600": displayInfo.label === 'متأخر',
                                      "bg-yellow-100/80 text-yellow-600": displayInfo.label === 'مدفوع جزئياً',
                                      "bg-green-100/80 text-green-600": displayInfo.label === 'مدفوع',
                                    })}>
                                        {installment.installment_number}
                                    </div>
                                    <div className="mr-3 text-right">
                                        <div className="font-bold text-sm text-slate-800 leading-tight">
                                            {Number(installment.installment_amount).toLocaleString('en-US')}
                                        </div>
                                        <div className="text-[11px] text-slate-500 mt-0.5">
                                            <span>{installment.installment_label || `القسط رقم ${installment.installment_number}`}</span>
                                            <span className="mx-1.5 text-slate-300">&middot;</span>
                                            <span className="font-mono text-[10px] text-slate-400 tracking-wider">
                                                {new Date(installment.installment_date).toLocaleDateString('en-GB')}
                                            </span>
                                        </div>
                                   </div>
                                </div>
    
                                <div className="text-left flex-shrink-0">
                                    <Badge variant="outline" className={cn(
                                        "text-[10px] font-medium leading-tight px-2 py-1 w-[70px] text-center justify-center",
                                        displayInfo.className
                                    )}>
                                        {displayInfo.label}
                                    </Badge>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="text-center py-12 text-slate-500 text-sm">لا توجد أقساط لعرضها.</div>
            )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default InstallmentsDisplayTab;
