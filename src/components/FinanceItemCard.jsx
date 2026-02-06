import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, XCircle, User, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

const FinanceItemCard = ({ finance, onClick }) => {
  const beneficiaryName = finance.accounts?.name || finance.accounts?.nickname || 'مستفيد غير معروف';
  const status = finance.status || 'pending'; // pending, approved, rejected
  
  // Status Config
  const statusConfig = {
    pending: {
      color: 'bg-amber-500',
      lightBg: 'bg-amber-50',
      borderClass: 'border-l-amber-500',
      textColor: 'text-amber-700',
      iconColor: 'text-amber-600',
      icon: Clock,
      label: 'مراجعة'
    },
    approved: {
      color: 'bg-emerald-500', 
      lightBg: 'bg-emerald-50',
      borderClass: 'border-l-emerald-500',
      textColor: 'text-emerald-700',
      iconColor: 'text-emerald-600',
      icon: CheckCircle2,
      label: 'معتمد'
    },
    rejected: {
      color: 'bg-red-500',
      lightBg: 'bg-red-50',
      borderClass: 'border-l-red-500',
      textColor: 'text-red-700',
      iconColor: 'text-red-600',
      icon: XCircle,
      label: 'مرفوض'
    },
    completed: {
      color: 'bg-blue-500',
      lightBg: 'bg-blue-50',
      borderClass: 'border-l-blue-500',
      textColor: 'text-blue-700',
      iconColor: 'text-blue-600',
      icon: CheckCircle2,
      label: 'منتهي'
    }
  };

  const config = statusConfig[status] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <motion.div 
      onClick={onClick}
      layout
      whileHover={{ scale: 1.01, translateY: -1 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative group flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border bg-white cursor-pointer shadow-sm transition-all duration-200",
        "hover:shadow-md hover:border-slate-300",
        "border-slate-100", 
        config.borderClass,
        "border-l-[4px]" 
      )}
    >
      {/* Right Side: Info */}
      <div className="flex items-center gap-3 min-w-0 mb-2 sm:mb-0">
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors", 
          config.lightBg
        )}>
          <User className={cn("w-4 h-4", config.iconColor)} />
        </div>
        
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-700 transition-colors">
            {beneficiaryName}
          </span>
          <div className="flex flex-wrap items-center gap-2">
             <span className={cn(
               "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border",
               config.lightBg,
               config.textColor,
               "border-transparent" 
             )}>
                <StatusIcon className="w-3 h-3" /> 
                {config.label}
             </span>
             
             <div className="flex items-center gap-1 text-[9px] text-slate-400 font-medium">
                <CalendarDays className="w-3 h-3" />
                <span>{finance.finance_date ? new Date(finance.finance_date).toLocaleDateString('ar-EG') : ''}</span>
             </div>
          </div>
        </div>
      </div>

      {/* Left Side: Amount */}
      <div className="text-left pl-1 self-end sm:self-center">
         <div className="text-sm md:text-base font-bold text-slate-900 tracking-tight font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-100 transition-colors">
           {Number(finance.finance_amount).toLocaleString()} 
           <span className="text-[10px] text-slate-500 font-bold mr-1 align-middle">ج.م</span>
         </div>
      </div>
    </motion.div>
  );
};

export default FinanceItemCard;