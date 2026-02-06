
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, ChevronLeft, User, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const FinanceInstallmentCard = ({ finance, onClick, index = 0 }) => {
  const metrics = finance.metrics || {};
  const {
    overdueAmount = 0,
    totalRemaining = 0,
    nextDueDate,
    paidCount = 0,
    totalInstallmentsCount = 0,
    overdueCountInst = 0
  } = metrics;

  // Format customer name: "Nickname (Name)" or just "Name"
  const customerDisplay = finance.customerNickname 
    ? `${finance.customerNickname} (${finance.customerName})`
    : finance.customerName || 'عميل';

  const handleDetailsClick = (e) => {
    e.stopPropagation();
    if (onClick) onClick();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={onClick}
      className="group relative bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200/80 shadow-[0_1px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.1)] hover:border-blue-300/50 transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Decorative top accent */}
      <div className={cn(
        "absolute top-0 inset-x-0 h-1 transition-colors duration-300",
        overdueAmount > 0 ? "bg-red-500/90" : "bg-emerald-500/90"
      )} />

      <div className="py-3 px-4 flex flex-col gap-2">
        
        {/* Row 1: Header (Finance Name + Customer) & Status */}
        <div className="flex justify-between items-start">
            <div className="flex flex-col gap-0.5 max-w-[70%]">
                <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <h4 className="font-bold text-slate-800 text-sm truncate group-hover:text-blue-700 transition-colors">
                        {finance.finance_name || finance.financeName || 'عقد تمويل'}
                    </h4>
                </div>
                
                <div className="flex items-center gap-1 text-[11px] text-slate-500 pr-0.5">
                    <User className="w-3 h-3 opacity-50" />
                    <span className="truncate" title={customerDisplay}>
                        {customerDisplay}
                    </span>
                </div>
            </div>

            {/* Status Badge */}
            <div className="shrink-0">
                {overdueAmount > 0 ? (
                    <div className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-0.5 rounded-md text-[10px] font-bold border border-red-100/50">
                        <AlertCircle className="w-3 h-3" />
                        <span>متأخرات</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md text-[10px] font-bold border border-emerald-100/50">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>منتظم</span>
                    </div>
                )}
            </div>
        </div>

        {/* Row 2: Metrics (Horizontal) */}
        <div className="flex items-center gap-3 bg-slate-50/60 rounded-lg p-2 border border-slate-100/60">
            <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-medium leading-none mb-1">المتبقي</span>
                <span className="text-xs font-bold text-slate-700 font-mono tracking-tight">
                    {totalRemaining.toLocaleString()}
                </span>
            </div>
            
            {overdueAmount > 0 && (
                <>
                <div className="w-px h-5 bg-slate-200/60"></div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-red-500/80 font-bold leading-none mb-1">مستحق</span>
                    <span className="text-xs font-bold text-red-600 font-mono tracking-tight">
                        {overdueAmount.toLocaleString()}
                    </span>
                </div>
                </>
            )}
        </div>

        {/* Row 3: Progress Bar */}
        <div className="space-y-1.5 pt-1">
             <div className="flex justify-between items-center text-[10px] text-slate-500 px-0.5">
                 <div className="flex items-center gap-1">
                    <span className={cn("font-medium", overdueAmount > 0 ? "text-red-600" : "text-slate-600")}>
                        {overdueAmount > 0 ? "متأخر منذ:" : "القسط القادم:"}
                    </span>
                    <span className="font-mono text-slate-700">
                        {nextDueDate 
                            ? new Date(nextDueDate).toLocaleDateString('ar-EG', {month: 'numeric', day: 'numeric'}) 
                            : '-'}
                    </span>
                 </div>
                 <div className="font-mono opacity-80 text-[9px]">
                     {paidCount}/{totalInstallmentsCount}
                 </div>
             </div>

             {/* Progress Bar (Visual Ticks) */}
             <div className="flex gap-[1px] h-1.5 w-full bg-slate-100/50 rounded-full overflow-hidden" dir="rtl">
                  {Array.from({ length: Math.min(totalInstallmentsCount, 40) }).map((_, i) => {
                      let colorClass = "bg-slate-200/60"; // Future
                      if (i < paidCount) colorClass = "bg-emerald-500"; // Paid
                      else if (i < paidCount + overdueCountInst) colorClass = "bg-red-500"; // Overdue

                      return <div key={i} className={cn("flex-1 h-full rounded-[1px]", colorClass)} />;
                  })}
             </div>
        </div>

        {/* Row 4: Action Button (Compact) */}
        <div className="flex justify-end pt-1">
            <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 px-2 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-50/80 -mr-2"
                onClick={handleDetailsClick}
            >
                <span>عرض التفاصيل</span>
                <ChevronLeft className="w-3 h-3 mr-0.5" />
            </Button>
        </div>

      </div>
    </motion.div>
  );
};

export default FinanceInstallmentCard;
