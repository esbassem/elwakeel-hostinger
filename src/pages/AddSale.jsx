
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronRight } from 'lucide-react';

const AddSale = ({ onBack }) => {
  return (
    <motion.div 
      dir="rtl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-gray-50 dark:bg-black min-h-full flex flex-col"
    >
       <div className="sticky top-0 z-20 bg-gray-50/80 dark:bg-black/80 backdrop-blur-sm border-b border-gray-100 dark:border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-16">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ChevronRight className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </Button>
        </div>
      </div>

      <div className="flex-grow w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-6 mb-6">
             <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-800 dark:text-gray-100">إضافة عملية بيع</h1>
             <p className="text-gray-500 dark:text-gray-400 mt-1">املأ التفاصيل أدناه لتسجيل عملية بيع جديدة.</p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-6 space-y-5">
            <div className="space-y-2">
              <label htmlFor="productName" className="text-sm font-medium text-gray-600 dark:text-gray-300 px-1">اسم المنتج</label>
              <Input id="productName" type="text" placeholder="مثال: هاتف ذكي" className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg h-12 text-base" />
            </div>
            <div className="space-y-2">
              <label htmlFor="customerName" className="text-sm font-medium text-gray-600 dark:text-gray-300 px-1">اسم العميل</label>
              <Input id="customerName" type="text" placeholder="مثال: محمد علي" className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg h-12 text-base" />
            </div>
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium text-gray-600 dark:text-gray-300 px-1">المبلغ (ريال)</label>
              <Input id="amount" type="number" placeholder="مثال: 2500" className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg h-12 text-base" />
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="sticky bottom-0 p-4 bg-white/50 dark:bg-black/50 backdrop-blur-sm border-t border-gray-100 dark:border-gray-800"
      >
        <div className="max-w-2xl mx-auto">
          <Button className="w-full h-14 rounded-xl text-lg font-bold">حفظ عملية البيع</Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AddSale;
