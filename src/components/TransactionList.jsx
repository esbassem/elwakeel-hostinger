import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, TrendingUp, TrendingDown, Calendar, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TransactionList = ({ transactions, onDelete }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (transactions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-xl p-12 text-center"
      >
        <div className="text-slate-500 mb-4">
          <TrendingUp className="w-16 h-16 mx-auto opacity-50" />
        </div>
        <h3 className="text-xl font-semibold text-slate-400 mb-2">لا توجد عمليات</h3>
        <p className="text-slate-500">ابدأ بإضافة عملياتك المالية</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="space-y-3"
    >
      <h2 className="text-xl font-bold text-white mb-4">سجل العمليات</h2>
      <AnimatePresence>
        {transactions.map((transaction, index) => (
          <motion.div
            key={transaction.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: index * 0.05 }}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4 hover:bg-slate-800/70 transition-all group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className={`p-3 rounded-lg ${
                  transaction.type === 'income' 
                    ? 'bg-emerald-500/10 text-emerald-500' 
                    : 'bg-red-500/10 text-red-500'
                }`}>
                  {transaction.type === 'income' ? (
                    <TrendingUp className="w-5 h-5" />
                  ) : (
                    <TrendingDown className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white truncate" dir="rtl">
                      {transaction.description}
                    </h3>
                    {transaction.category && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-300">
                        <Tag className="w-3 h-3" />
                        {transaction.category}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(transaction.date)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-left">
                  <div className={`text-xl font-bold ${
                    transaction.type === 'income' ? 'text-emerald-500' : 'text-red-500'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'} {parseFloat(transaction.amount).toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-400">{transaction.currency}</div>
                </div>

                <Button
                  onClick={() => onDelete(transaction.id)}
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default TransactionList;