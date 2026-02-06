
import React from 'react';
import { 
  FileText, Users, Calendar, Banknote, 
  CheckCircle2, ArrowLeft, LayoutList, Wallet
} from 'lucide-react';
import { useFinanceCalculations } from '@/hooks/useFinanceCalculations';

const FinanceReviewSummary = ({ formData, guarantors, installments, receipts, agreements, accounts = [] }) => {
  const { calculateTotalInstallmentsAmount, calculateProfit } = useFinanceCalculations();

  const totalAmount = calculateTotalInstallmentsAmount(installments);
  const profit = calculateProfit(formData.finance_amount, installments);
  const profitPercentage = formData.finance_amount > 0 ? ((profit / formData.finance_amount) * 100).toFixed(1) : 0;

  // Resolve account names for display
  const customerName = formData.customer_type === 'new' 
    ? formData.new_customer_name 
    : accounts.find(a => a.id === formData.beneficiary_account_id)?.name || 'غير محدد';

  const resolvedGuarantors = guarantors.map(g => {
    const acc = accounts.find(a => a.id === g.guarantor_account_id);
    return {
      ...g,
      name: acc?.name || 'غير محدد',
      phone: acc?.phone1 || ''
    };
  });

  return (
    <div className="space-y-6 pb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Top Stats Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 text-white shadow-lg">
         <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center border border-white/10">
               <Wallet className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
               <h3 className="font-bold text-lg">{formData.finance_name || 'تمويل بدون عنوان'}</h3>
               <p className="text-xs text-slate-400">ملخص العملية المالية</p>
            </div>
         </div>

         <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-4">
            <div>
               <p className="text-[10px] text-slate-400 mb-1">رأس المال</p>
               <p className="font-bold text-lg font-mono">{Number(formData.finance_amount).toLocaleString()}</p>
            </div>
            <div>
               <p className="text-[10px] text-slate-400 mb-1">إجمالي العائد</p>
               <p className="font-bold text-lg text-emerald-400 font-mono">{totalAmount.toLocaleString()}</p>
            </div>
            <div>
               <p className="text-[10px] text-slate-400 mb-1">صافي الربح</p>
               <div className="flex items-center gap-2">
                  <p className="font-bold text-lg text-blue-400 font-mono">{profit.toLocaleString()}</p>
                  <span className="text-[10px] bg-white/10 px-1.5 rounded text-slate-300 font-mono">%{profitPercentage}</span>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
         {/* Customer Info */}
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="font-bold text-xs text-slate-500 mb-3 flex items-center gap-2">
               <Users className="w-4 h-4" />
               بيانات العميل
            </h4>
            <div className="space-y-2">
               <div className="flex justify-between text-xs">
                  <span className="text-slate-400">الاسم:</span>
                  <span className="font-bold text-slate-800">{customerName}</span>
               </div>
               <div className="flex justify-between text-xs">
                  <span className="text-slate-400">نوع العميل:</span>
                  <span className="font-bold text-slate-800">{formData.customer_type === 'new' ? 'عميل جديد' : 'مسجل مسبقاً'}</span>
               </div>
               <div className="flex justify-between text-xs">
                  <span className="text-slate-400">تاريخ البدء:</span>
                  <span className="font-bold text-slate-800 font-mono">{formData.finance_date}</span>
               </div>
            </div>
         </div>

         {/* Guarantors & Attachments */}
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="font-bold text-xs text-slate-500 mb-3 flex items-center gap-2">
               <FileText className="w-4 h-4" />
               المرفقات والضامنين
            </h4>
            <div className="space-y-2">
               <div className="flex justify-between text-xs">
                  <span className="text-slate-400">عدد الضامنين:</span>
                  <span className="font-bold text-slate-800">{resolvedGuarantors.length}</span>
               </div>
               <div className="flex justify-between text-xs">
                  <span className="text-slate-400">إيصالات الأمانة:</span>
                  <span className="font-bold text-slate-800">{receipts.filter(r => !!r).length} إيصال</span>
               </div>
               <div className="flex justify-between text-xs">
                  <span className="text-slate-400">العقود المرفقة:</span>
                  <span className="font-bold text-slate-800">{agreements.length} عقد</span>
               </div>
            </div>
         </div>
      </div>

      {/* Guarantors Detail List */}
      {resolvedGuarantors.length > 0 && (
         <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
               <h4 className="font-bold text-xs text-slate-600">قائمة الضامنين</h4>
            </div>
            <div className="p-2 space-y-1">
               {resolvedGuarantors.map((g, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 rounded hover:bg-slate-50 text-xs">
                     <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px]">{idx+1}</span>
                        <span className="font-bold text-slate-800">{g.name}</span>
                     </div>
                     <span className="text-slate-500">{g.relationship}</span>
                  </div>
               ))}
            </div>
         </div>
      )}

      {/* Installments Preview */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
         <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <h4 className="font-bold text-xs text-slate-600 flex items-center gap-2">
               <LayoutList className="w-4 h-4" />
               جدول الأقساط ({installments.length})
            </h4>
            <span className="text-[10px] font-mono text-slate-400">معاينة سريعة</span>
         </div>
         <div className="max-h-40 overflow-y-auto custom-scrollbar">
            <table className="w-full text-center text-xs">
               <thead className="bg-slate-50 sticky top-0 text-slate-500">
                  <tr>
                     <th className="py-2">#</th>
                     <th className="py-2">التاريخ</th>
                     <th className="py-2">المبلغ</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {installments.map((inst, idx) => (
                     <tr key={idx}>
                        <td className="py-2 font-mono text-slate-400">{inst.installment_number}</td>
                        <td className="py-2">{inst.installment_date}</td>
                        <td className="py-2 font-bold font-mono text-emerald-600">{Number(inst.installment_amount).toLocaleString()}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
      
      <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-xs flex gap-2 items-start">
         <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
         <p>عند الاعتماد، سيتم إنشاء حساب للعميل (إذا كان جديداً)، تسجيل عقد التمويل، جدولة الأقساط، وربط جميع الضامنين والمرفقات تلقائياً.</p>
      </div>

    </div>
  );
};

export default FinanceReviewSummary;
