
import React from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const InstallmentTable = ({ installments, onChange, onRegenerate }) => {
  
  // Recalculate totals whenever table changes
  const totalAmount = installments.reduce((sum, inst) => sum + (Number(inst.installment_amount) || 0), 0);

  const handleCellChange = (index, field, value) => {
    const updated = [...installments];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      if (dateString instanceof Date) return dateString.toISOString().split('T')[0];
      if (typeof dateString === 'string') {
          if (dateString.includes('T')) return dateString.split('T')[0];
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
          const date = new Date(dateString);
          if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
      }
      return '';
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="space-y-3" dir="rtl">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-xs font-bold text-stone-700">جدول الأقساط المقترح</h3>
        {onRegenerate && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRegenerate}
            className="h-6 px-2 text-[10px] text-blue-600 hover:bg-blue-50"
          >
             <RotateCcw className="w-3 h-3 ml-1" />
             تحديث الجدول
          </Button>
        )}
      </div>

      <div className="border border-stone-200 rounded-xl bg-white overflow-hidden flex flex-col max-h-[220px]">
         <div className="overflow-y-auto custom-scrollbar flex-1">
            <table className="w-full text-xs">
               <tbody className="divide-y divide-stone-100">
                  {installments.map((inst, idx) => (
                     <tr key={idx} className="group hover:bg-blue-50/50 transition-colors">
                        <td className="py-2 px-2 text-right w-20 text-stone-600 font-bold text-xs bg-slate-50/50">
                           {inst.installment_label || `قسط ${idx + 1}`}
                        </td>
                        <td className="py-1 px-2">
                           <input 
                              type="date"
                              className="w-full bg-transparent border-0 focus:ring-0 p-1 text-xs font-mono font-bold text-stone-800 h-8 rounded hover:bg-white focus:bg-white transition-all cursor-pointer text-center"
                              value={formatDateForInput(inst.installment_date)}
                              onChange={(e) => handleCellChange(idx, 'installment_date', e.target.value)}
                           />
                        </td>
                        <td className="py-1 px-2">
                           <input 
                              type="number"
                              className="w-full bg-transparent border-0 focus:ring-0 p-1 text-xs font-bold text-stone-800 h-8 rounded hover:bg-white focus:bg-white transition-all text-center"
                              value={inst.installment_amount}
                              onChange={(e) => handleCellChange(idx, 'installment_amount', e.target.value)}
                           />
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
         <div className="bg-stone-100 p-2 rounded-lg text-center">
            <span className="block text-[10px] text-stone-500">إجمالي الأقساط</span>
            <span className="block text-sm font-bold text-stone-800">{totalAmount.toLocaleString()}</span>
         </div>
         <div className="bg-blue-50 p-2 rounded-lg text-center border border-blue-100">
            <span className="block text-[10px] text-blue-500">عدد الأقساط</span>
            <span className="block text-sm font-bold text-blue-700">{installments.length}</span>
         </div>
      </div>
    </div>
  );
};

export default InstallmentTable;
