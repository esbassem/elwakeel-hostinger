
import React from 'react';
import { CheckCircle2, CalendarCheck, Banknote, UserCheck, ArrowLeft, Building } from 'lucide-react';

const DisbursementTabContent = ({ finance }) => {
  if (!finance) return null;

  return (
    <div className="pb-10 max-w-3xl mx-auto">
       {/* Status Card */}
       <div className="bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden mb-8">
          <div className="bg-emerald-50/50 p-6 flex items-start gap-4">
             <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-emerald-600 shrink-0 ring-4 ring-emerald-50/50">
                <CheckCircle2 className="w-6 h-6" />
             </div>
             <div>
                <h3 className="text-lg font-bold text-emerald-900 mb-1">تم الصرف بنجاح</h3>
                <p className="text-sm text-emerald-700/80 leading-relaxed max-w-lg">
                   تمت الموافقة على هذا التمويل وصرف المبلغ بالكامل. العملية مكتملة ولا تتطلب إجراءات إضافية.
                </p>
             </div>
          </div>
       </div>

       {/* Timeline / Details */}
       <div className="relative border-r-2 border-slate-100 mr-4 space-y-8 pr-8">
          
          <div className="relative">
             <div className="absolute top-0 -right-[41px] w-6 h-6 rounded-full bg-blue-600 border-4 border-white shadow-sm flex items-center justify-center">
                <Banknote className="w-3 h-3 text-white" />
             </div>
             <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">تفاصيل المبلغ</span>
                <div className="flex justify-between items-center mb-2">
                   <span className="text-slate-600 font-medium">المبلغ الأساسي</span>
                   <span className="font-mono font-bold text-slate-800">{Number(finance.finance_amount).toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                   <span className="text-slate-600 font-medium">الأرباح</span>
                   <span className="font-mono font-bold text-emerald-600">
                      +{(Number(finance.total_amount) - Number(finance.finance_amount)).toLocaleString()} ج.م
                   </span>
                </div>
                <div className="border-t border-slate-100 mt-3 pt-3 flex justify-between items-center">
                   <span className="font-bold text-slate-800">الإجمالي المستحق</span>
                   <span className="font-mono font-black text-xl text-blue-600">{Number(finance.total_amount).toLocaleString()} ج.م</span>
                </div>
             </div>
          </div>

          <div className="relative">
             <div className="absolute top-0 -right-[41px] w-6 h-6 rounded-full bg-slate-200 border-4 border-white shadow-sm flex items-center justify-center">
                <CalendarCheck className="w-3 h-3 text-slate-500" />
             </div>
             <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">تاريخ الصرف</span>
                   <span className="font-bold text-slate-800 text-lg font-mono">
                      {new Date(finance.created_at).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                   </span>
                </div>
                <CalendarCheck className="w-8 h-8 text-slate-100" />
             </div>
          </div>

          <div className="relative">
             <div className="absolute top-0 -right-[41px] w-6 h-6 rounded-full bg-slate-200 border-4 border-white shadow-sm flex items-center justify-center">
                <UserCheck className="w-3 h-3 text-slate-500" />
             </div>
             <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">المسؤول عن الصرف</span>
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                      {finance.approved_by ? finance.approved_by.charAt(0) : 'S'}
                   </div>
                   <div>
                      <div className="font-bold text-slate-800">{finance.approved_by || 'إدارة النظام'}</div>
                      <div className="text-xs text-slate-400">مسؤول النظام</div>
                   </div>
                </div>
             </div>
          </div>

       </div>
    </div>
  );
};

export default DisbursementTabContent;
