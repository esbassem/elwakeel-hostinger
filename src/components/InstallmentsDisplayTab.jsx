
import React, { useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInstallments = async () => {
      if (!finance_id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('finance_installments')
        .select('*')
        .eq('finance_id', finance_id)
        .order('installment_number', { ascending: true });

      if (error) {
        console.error('Error fetching installments:', error);
      } else {
        setInstallments(data);
      }
      setLoading(false);
    };

    fetchInstallments();
  }, [finance_id]);

  const statusUi = {
    paid: { label: "مدفوع", className: "border-green-300 bg-green-50 text-green-700" },
    unpaid: { label: "غير مدفوع", className: "border-red-300 bg-red-50 text-red-700" },
    partially_paid: { label: "مدفوع جزئياً", className: "border-yellow-300 bg-yellow-50 text-yellow-700" },
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
            {installments.length > 0 ? (
                <div className="p-1.5" dir="rtl">
                    {installments.map((installment) => (
                        <div key={installment.id} className="p-2.5 rounded-lg flex items-center justify-between hover:bg-slate-50 transition-colors">
                           <div className="flex-grow flex items-center">
                                <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center bg-slate-100/80 text-slate-500 rounded-lg font-mono text-xs font-semibold">
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
                                    "text-[10px] font-medium leading-tight px-2 py-1 w-[60px] text-center justify-center",
                                    statusUi[installment.status]?.className || 'bg-gray-100 text-gray-800'
                                )}>
                                    {statusUi[installment.status]?.label || installment.status}
                                </Badge>
                            </div>
                        </div>
                    ))}
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
