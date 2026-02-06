import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, ChevronLeft, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PendingApprovalsNotification = ({ pendingFinances, onViewPending }) => {
  if (!pendingFinances || pendingFinances.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mb-12 overflow-hidden"
    >
      <div className="relative bg-gradient-to-r from-red-600 to-red-800 rounded-2xl p-6 shadow-xl shadow-red-900/20 text-white overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/20 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center md:text-right">
             <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-inner shrink-0">
               <ShieldAlert className="w-7 h-7 text-white animate-pulse" />
             </div>
             <div>
                <h3 className="text-xl font-bold mb-1">طلبات بانتظار المراجعة</h3>
                <p className="text-red-100 text-sm opacity-90">
                  يوجد <span className="font-bold text-white text-lg mx-1 border-b border-white/30">{pendingFinances.length}</span> طلبات تمويل جديدة تتطلب اتخاذ إجراء فوري
                </p>
             </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
             <Button 
                onClick={() => onViewPending(pendingFinances[0])}
                className="w-full md:w-auto bg-white text-red-700 hover:bg-red-50 font-bold border-0 shadow-lg hover:shadow-xl transition-all h-11 px-6 rounded-xl group"
             >
                مراجعة الطلبات
                <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
             </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PendingApprovalsNotification;