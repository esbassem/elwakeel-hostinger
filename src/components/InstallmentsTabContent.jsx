import React from 'react';
import { Calendar, Loader2 } from 'lucide-react';
import { usePaymentDistribution } from '@/hooks/usePaymentDistribution';
import InstallmentTableRow from './InstallmentTableRow';

const InstallmentsTabContent = ({ installments = [], currentUser, onRefresh }) => {
  const financeId = installments.length > 0 ? installments[0].finance_id : null;
  const { distributedInstallments, loading } = usePaymentDistribution(financeId, installments, onRefresh ? 1 : 0);

  // Sort by date to ensure correct order
  const sortedInstallments = [...distributedInstallments].sort((a, b) => new Date(a.installment_date) - new Date(b.installment_date));
  
  if (loading && installments.length > 0) {
     return (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-slate-200">
           <Loader2 className="w-8 h-8 text-slate-300 animate-spin mb-2" />
           <p className="text-slate-400 text-xs font-bold">جاري حساب توزيع المدفوعات...</p>
        </div>
     );
  }

  return (
    <div className="space-y-4" dir="rtl">
        {/* Installments Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden font-cairo flex flex-col">
          {distributedInstallments.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100">
                 <Calendar className="w-6 h-6 text-slate-300" />
              </div>
              <h3 className="text-slate-800 font-bold mb-1 text-sm">لا توجد أقساط</h3>
              <p className="text-slate-400 text-xs">لم يتم تسجيل أقساط لهذا التمويل بعد</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse">
                  <thead className="bg-slate-50/80 text-slate-500 text-[10px] font-bold border-b border-slate-100">
                    <tr>
                        <th className="py-3 px-4 text-right">رقم القسط</th>
                        <th className="py-3 px-4">القيمة / المدفوع</th>
                        <th className="py-3 px-4">تاريخ الاستحقاق</th>
                        <th className="py-3 px-4">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100/80">
                    {sortedInstallments.map((inst, index) => (
                      <InstallmentTableRow 
                        key={inst.id || index} 
                        installment={inst} 
                        index={index} 
                      />
                    ))}
                  </tbody>
                </table>
            </div>
          )}
        </div>
    </div>
  );
};

export default InstallmentsTabContent;