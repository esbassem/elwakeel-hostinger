
import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, AlertCircle, Clock, Percent, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const InstallmentTableRow = ({ installment, index }) => {
  const currentDate = new Date();
  const instDate = new Date(installment.installment_date);
  
  const paidAmount = Number(installment.calculated_paid_amount || 0);
  const totalAmount = Number(installment.installment_amount || 0);
  const percentPaid = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
  const isFullyPaid = installment.is_fully_paid || (totalAmount > 0 && paidAmount >= totalAmount);

  // Status Logic
  let statusKey = 'pending';

  // Compare months (ignore time/day for the classification categories requested)
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const instYear = instDate.getFullYear();
  const instMonth = instDate.getMonth();

  const isPastMonth = instYear < currentYear || (instYear === currentYear && instMonth < currentMonth);
  const isCurrentMonth = instYear === currentYear && instMonth === currentMonth;

  if (isFullyPaid) {
    statusKey = 'paid';
  } else if (paidAmount > 0) {
    statusKey = 'partially_paid';
  } else if (isPastMonth) {
    statusKey = 'overdue';
  } else if (isCurrentMonth) {
    statusKey = 'due';
  } else {
    statusKey = 'pending'; // Future
  }
  
  const statusConfig = {
    paid: { 
        label: 'مدفوع', 
        color: 'text-emerald-700', 
        bg: 'bg-emerald-50 border-emerald-100', 
        icon: CheckCircle2,
        barColor: 'bg-emerald-500'
    },
    partially_paid: { 
        label: 'مدفوع جزئياً', 
        color: 'text-blue-700', 
        bg: 'bg-blue-50 border-blue-100', 
        icon: Percent,
        barColor: 'bg-blue-500'
    },
    due: { 
        label: 'مستحق', 
        color: 'text-amber-700', 
        bg: 'bg-amber-50 border-amber-100', 
        icon: AlertTriangle,
        barColor: 'bg-amber-500'
    },
    overdue: { 
        label: 'متأخر', 
        color: 'text-rose-700', 
        bg: 'bg-rose-50 border-rose-100', 
        icon: AlertCircle,
        barColor: 'bg-rose-500' 
    },
    pending: { 
        label: 'مؤجل', 
        color: 'text-slate-600', 
        bg: 'bg-slate-50 border-slate-100', 
        icon: Clock,
        barColor: 'bg-slate-500'
    },
  };

  const config = statusConfig[statusKey] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <motion.tr 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="group hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0"
    >
      <td className="py-2.5 px-3 align-middle text-right">
         <div className="inline-flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-[10px] font-mono border border-slate-200">
               {index + 1}
            </div>
            <span className="text-xs font-bold text-slate-700 hidden sm:inline">{installment.installment_label || `قسط ${index + 1}`}</span>
         </div>
      </td>
      
      <td className="py-2.5 px-3 align-middle text-center">
         <div className="flex flex-col items-center">
            <span className="text-xs font-black text-slate-800 font-mono">
               {totalAmount.toLocaleString()}
               <span className="text-[9px] text-slate-400 font-sans mr-1">د.ل</span>
            </span>
            
            {/* Show Paid Amount Progress */}
            {paidAmount > 0 && (
               <div className="mt-1 w-full max-w-[80px]">
                  <div className="flex justify-between text-[8px] text-slate-500 mb-0.5 font-medium">
                     <span>{paidAmount.toLocaleString()}</span>
                     <span>{percentPaid.toFixed(0)}%</span>
                  </div>
                  <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                     <div 
                        className={cn("h-full rounded-full transition-all duration-500", config.barColor)}
                        style={{ width: `${percentPaid}%` }}
                     />
                  </div>
               </div>
            )}
         </div>
      </td>

      <td className="py-2.5 px-3 align-middle text-center">
         <div className="flex items-center justify-center gap-1.5 text-slate-600">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span className={cn("text-xs font-bold font-mono", statusKey === 'overdue' ? "text-rose-600" : "")}>
               {new Date(installment.installment_date).toLocaleDateString('ar-LY')}
            </span>
         </div>
      </td>

      <td className="py-2.5 px-3 align-middle text-center">
         <div className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold w-fit mx-auto",
            config.bg, config.color
         )}>
            <StatusIcon className="w-3 h-3" />
            <span>{config.label}</span>
         </div>
      </td>
    </motion.tr>
  );
};

export default InstallmentTableRow;
