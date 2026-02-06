
import React from 'react';
import { Phone, ChevronLeft, User, AlertCircle, FileText, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

const OverdueInstallmentsTable = ({ installments: items, loading, onInstallmentSelect, viewMode = 'customers' }) => {
  if (loading) {
    return <TableSkeleton />;
  }

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-lg border border-dashed border-slate-200">
        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <User className="w-6 h-6 text-slate-300" />
        </div>
        <h3 className="text-sm font-bold text-slate-700">لا يوجد بيانات</h3>
        <p className="text-xs text-slate-400">لا توجد نتائج مطابقة للعرض الحالي</p>
      </div>
    );
  }

  return (
    <div className="space-y-2" dir="rtl">
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: index * 0.03, duration: 0.2 }}
            onClick={() => onInstallmentSelect(item)}
            className="group bg-white rounded-lg border border-slate-100 hover:border-indigo-200 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
          >
             
             {/* 1. Identity Section (Right) */}
             <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Avatar / Icon */}
                <div className="w-10 h-10 rounded-full bg-slate-50 text-indigo-600 flex items-center justify-center font-bold text-sm border border-slate-100 shrink-0 group-hover:bg-indigo-50 transition-colors">
                   {viewMode === 'finance_accounts' ? (
                     <FileText className="w-4 h-4" />
                   ) : (
                     item.nickname?.charAt(0) || item.name?.charAt(0) || <User className="w-4 h-4" />
                   )}
                </div>

                {/* Name & Info */}
                <div className="flex flex-col min-w-0 pr-1">
                   {/* Primary Title */}
                   <h3 className="font-bold text-slate-800 text-sm truncate">
                      {viewMode === 'finance_accounts' ? item.contractName : (item.nickname ? `${item.nickname} (${item.name})` : item.name)}
                   </h3>
                   
                   {/* Secondary Info */}
                   <div className="flex items-center gap-1 mt-1">
                      {viewMode === 'finance_accounts' ? (
                          <>
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="text-xs text-slate-500 truncate">
                                {item.customerName}
                            </span>
                          </>
                      ) : (
                          <>
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="text-xs text-slate-500 font-mono dir-ltr text-right truncate">
                                {item.phone || item.phone1 || '---'}
                            </span>
                          </>
                      )}
                   </div>
                </div>
             </div>

             {/* 2. Financial Metrics (Left) */}
             <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                
                <div className="flex flex-col items-end">
                   {/* Conditional Label based on View Mode */}
                   <span className="text-[10px] text-red-500 mb-1 flex items-center gap-1 font-medium bg-red-50 px-2 py-0.5 rounded-full">
                      {viewMode === 'finance_accounts' ? (
                         <>
                           <Calendar className="w-3 h-3" />
                           {item.overdueCount} قسط متأخر
                         </>
                      ) : (
                         <>
                           <AlertCircle className="w-3 h-3" />
                           المستحق الآن
                         </>
                      )}
                   </span>
                   
                   {/* Amount Display */}
                   <div className="flex items-center gap-1">
                     <span className="text-lg font-bold text-red-600 font-mono tracking-tight">
                        {item.totalOverdueAmount?.toLocaleString() || '0'}
                     </span>
                     <span className="text-[10px] text-red-400 font-medium">ج.م</span>
                   </div>
                </div>

                {/* Action Indicator */}
                <div className="mr-1 pl-1 text-slate-300 group-hover:text-indigo-600 transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                </div>
             </div>

          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const TableSkeleton = () => (
  <div className="space-y-2">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-2 w-24" />
          </div>
        </div>
        <div className="flex gap-4">
           <Skeleton className="h-8 w-24" />
        </div>
      </div>
    ))}
  </div>
);

export default OverdueInstallmentsTable;
