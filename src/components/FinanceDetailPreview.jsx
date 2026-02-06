
import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Calendar, 
  User, 
  Wallet, 
  FileText, 
  Phone, 
  MapPin, 
  ShieldCheck,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFinanceCalculations } from '@/hooks/useFinanceCalculations';
import { cn } from '@/lib/utils';

const DetailSection = ({ title, icon: Icon, children, className }) => (
  <div className={cn("p-5 bg-zinc-50/50 rounded-xl border-2 border-zinc-100 hover:border-zinc-200 transition-colors", className)}>
    <h4 className="text-base font-black text-zinc-900 flex items-center gap-2 mb-4">
      <div className="p-1.5 bg-red-100 rounded-lg text-red-600">
        <Icon className="w-4 h-4" />
      </div>
      {title}
    </h4>
    <div className="space-y-3">
      {children}
    </div>
  </div>
);

const DetailRow = ({ icon: Icon, label, value, highlight = false }) => (
  <div className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0 last:pb-0">
    <div className="flex items-center gap-2 text-zinc-500">
      <Icon className="w-4 h-4" />
      <span className="text-xs font-bold">{label}</span>
    </div>
    <span className={cn(
      "text-sm font-bold text-right", 
      highlight ? "text-red-600 font-black text-base" : "text-zinc-900"
    )}>
      {value || '-'}
    </span>
  </div>
);

const FinanceDetailPreview = ({ finance, onNavigate }) => {
  const { getStatusLabel } = useFinanceCalculations();

  if (!finance) {
    return (
      <div className="h-full min-h-[600px] flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border-2 border-zinc-200 shadow-inner bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl border-4 border-zinc-50 animate-pulse">
          <Wallet className="w-10 h-10 text-red-600" />
        </div>
        <h3 className="text-2xl font-black text-zinc-900 mb-2">تفاصيل العقد</h3>
        <p className="text-zinc-500 font-bold max-w-xs">
          اختر عقد تمويل من القائمة الجانبية لعرض ملخص التفاصيل والمعلومات المالية
        </p>
      </div>
    );
  }

  const beneficiary = finance.accounts || {};

  return (
    <motion.div 
      key={finance.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-2xl border-2 border-zinc-200 shadow-xl overflow-hidden sticky top-6 flex flex-col h-full max-h-[calc(100vh-2rem)]"
    >
      {/* Header Banner */}
      <div className="bg-zinc-900 text-white p-8 relative overflow-hidden shrink-0 border-b-4 border-red-600">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-600/10 rounded-full blur-2xl -ml-10 -mb-10" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
             <span className={cn(
               "px-4 py-1.5 rounded-lg text-xs font-black border-2 tracking-wide uppercase",
               finance.status === 'pending' 
                 ? "bg-amber-500 text-white border-amber-600" 
                 : "bg-green-600 text-white border-green-700"
             )}>
               {getStatusLabel(finance.status)}
             </span>
             <span className="text-zinc-500 font-mono text-xs font-bold bg-zinc-800 px-2 py-1 rounded">#{finance.id.slice(0, 8)}</span>
          </div>
          
          <div className="space-y-1">
            <p className="text-zinc-400 text-sm font-bold">{finance.finance_name}</p>
            <h2 className="text-4xl font-black tracking-tight flex items-baseline gap-2">
              {Number(finance.finance_amount).toLocaleString()} 
              <span className="text-lg text-red-500 font-bold">د.ل</span>
            </h2>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
        {/* Beneficiary Info */}
        <DetailSection title="بيانات المستفيد" icon={User}>
           <DetailRow icon={User} label="الاسم الكامل" value={beneficiary.name || beneficiary.nickname} />
           <DetailRow icon={Phone} label="رقم الهاتف" value={beneficiary.phone1} />
           <DetailRow icon={MapPin} label="العنوان" value={beneficiary.address} />
           <DetailRow icon={ShieldCheck} label="رقم الهوية" value={beneficiary.national_id} />
        </DetailSection>

        {/* Contract Info */}
        <DetailSection title="معلومات العقد" icon={FileText} className="bg-red-50/30 border-red-100">
           <DetailRow 
             icon={Calendar} 
             label="تاريخ التعاقد" 
             value={finance.finance_date ? new Date(finance.finance_date).toLocaleDateString('en-GB') : '-'} 
           />
           <DetailRow 
             icon={Wallet} 
             label="المبلغ الإجمالي (مع الفوائد)" 
             value={`${Number(finance.total_amount || finance.finance_amount).toLocaleString()} د.ل`} 
             highlight
           />
        </DetailSection>

        {/* Action Button */}
        <div className="pt-2 mt-auto">
           <Button 
             onClick={() => onNavigate(finance.id)}
             className="w-full h-14 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-base shadow-lg shadow-red-200 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-between group border-2 border-red-700"
           >
             <span>عرض التفاصيل الكاملة والأقساط</span>
             <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
               <ChevronLeft className="w-5 h-5" />
             </div>
           </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default FinanceDetailPreview;
