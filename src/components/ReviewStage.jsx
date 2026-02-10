
import React from 'react';
import { Label } from '@/components/ui/label';
import { User, Calendar, FileText, CheckCircle2, Phone } from 'lucide-react';

const ReviewCard = ({ title, children, icon: Icon }) => (
  <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
    <div className="bg-stone-50 px-3 py-2 border-b border-stone-100 flex items-center gap-2">
      {Icon && <Icon className="w-3.5 h-3.5 text-blue-600" />}
      <h3 className="text-xs font-bold text-stone-700">{title}</h3>
    </div>
    <div className="p-3 text-xs">
      {children}
    </div>
  </div>
);

const ReviewStage = ({ formData, guarantors, installments, receipts, agreements }) => {
  const totalInstallments = installments.reduce((sum, i) => sum + Number(i.installment_amount), 0);
  const profit = totalInstallments - Number(formData.finance_amount);

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-2 bg-green-50 p-3 rounded-xl border border-green-100 text-green-700">
         <CheckCircle2 className="w-5 h-5" />
         <div>
            <p className="text-sm font-bold">جاهز للإنشاء</p>
            <p className="text-[10px] opacity-80">يرجى مراجعة البيانات قبل التأكيد النهائي</p>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
         <ReviewCard title="التمويل" icon={FileText}>
            <div className="space-y-1.5">
               <div className="flex justify-between">
                  <span className="text-stone-500">الاسم:</span>
                  <span className="font-bold">{formData.finance_name}</span>
               </div>
               <div className="flex justify-between">
                  <span className="text-stone-500">المبلغ:</span>
                  <span className="font-bold">{Number(formData.finance_amount).toLocaleString()}</span>
               </div>
               <div className="flex justify-between">
                  <span className="text-stone-500">التاريخ:</span>
                  <span>{formData.finance_date}</span>
               </div>
               <div className="pt-1 border-t border-dashed mt-1 flex justify-between text-green-600 font-bold">
                  <span>الربح المتوقع:</span>
                  <span>{profit.toLocaleString()}</span>
               </div>
            </div>
         </ReviewCard>

         <ReviewCard title="العميل" icon={User}>
            <div className="space-y-1.5">
               <div className="flex justify-between">
                  <span className="text-stone-500">الاسم:</span>
                  <span className="font-bold truncate max-w-[100px]">{formData.new_customer_name}</span>
               </div>
               <div className="flex justify-between">
                  <span className="text-stone-500">الهاتف:</span>
                  <span>{formData.new_customer_phone1}</span>
               </div>
               <div className="flex justify-between">
                  <span className="text-stone-500">العمل:</span>
                  <span>{formData.new_customer_job}</span>
               </div>
            </div>
         </ReviewCard>
      </div>

      <ReviewCard title="ملخص الأقساط" icon={Calendar}>
         <div className="grid grid-cols-3 gap-2 text-center mb-2">
            <div className="bg-stone-50 p-1 rounded">
               <span className="block text-[9px] text-stone-400">عدد</span>
               <span className="font-bold">{installments.length}</span>
            </div>
            <div className="bg-stone-50 p-1 rounded">
               <span className="block text-[9px] text-stone-400">إجمالي</span>
               <span className="font-bold">{totalInstallments.toLocaleString()}</span>
            </div>
            <div className="bg-stone-50 p-1 rounded">
               <span className="block text-[9px] text-stone-400">أول قسط</span>
               <span className="font-bold">{installments[0]?.installment_date}</span>
            </div>
         </div>
      </ReviewCard>

      <div className="grid grid-cols-2 gap-3">
         <div className="bg-stone-50 p-2 rounded-lg border border-stone-200 text-center">
            <span className="text-xs text-stone-500 block">الضامنين</span>
            <span className="text-lg font-bold text-blue-600">{guarantors.length}</span>
         </div>
         <div className="bg-stone-50 p-2 rounded-lg border border-stone-200 text-center">
            <span className="text-xs text-stone-500 block">المرفقات</span>
            <span className="text-lg font-bold text-purple-600">{receipts.length + agreements.length}</span>
         </div>
      </div>

      {guarantors.length > 0 && (
         <div className="space-y-2">
            <h4 className="text-xs font-bold text-stone-700">تفاصيل الضامنين</h4>
            <div className="grid grid-cols-2 gap-2">
               {guarantors.map((g, i) => (
                  <div key={i} className="bg-stone-50 p-2 rounded-lg border border-stone-200 text-xs">
                     <div className="font-bold mb-1">{g.name}</div>
                     <div className="flex items-center gap-1 text-stone-500">
                        <Phone className="w-3 h-3" />
                        <span>{g.phone}</span>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      )}
    </div>
  );
};

export default ReviewStage;
