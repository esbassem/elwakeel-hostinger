
import React from 'react';
import { motion } from 'framer-motion';
import { CalendarDays } from 'lucide-react';
import FinanceItemCard from './FinanceItemCard';

const FinanceMonthCard = ({ monthData, onFinanceClick, selectedFinanceId, index = 0 }) => {
  const { monthName, finances, stats } = monthData;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="mb-6 last:mb-0"
    >
      {/* Month Header - Sidebar Friendly */}
      <div className="flex items-center justify-between gap-2 mb-3 px-1">
         <div className="flex items-center gap-2 bg-zinc-900 text-white px-3 py-1.5 rounded-lg shadow-sm">
            <CalendarDays className="w-4 h-4 text-red-500" />
            <h3 className="font-bold text-xs sm:text-sm tracking-wide">{monthName}</h3>
         </div>
         
         <div className="h-px flex-1 bg-gradient-to-l from-transparent via-zinc-200 to-transparent mx-2 hidden sm:block" />
         
         <span className="text-[10px] font-bold text-zinc-400 bg-white px-2 py-1 rounded-md border border-zinc-100 shadow-sm whitespace-nowrap">
            {stats.count}
         </span>
      </div>

      {/* List */}
      <div className="flex flex-col gap-2">
        {finances.map((finance, i) => (
          <FinanceItemCard 
            key={finance.id} 
            finance={finance} 
            isSelected={selectedFinanceId === finance.id}
            onClick={() => onFinanceClick(finance)} 
          />
        ))}
      </div>
    </motion.div>
  );
};

export default FinanceMonthCard;
