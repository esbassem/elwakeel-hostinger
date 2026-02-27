import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const ReviewSheet = ({ 
  open, 
  onOpenChange, 
  transactions, 
  formatCurrency, 
  selected, 
  onSelectedChange, 
  onApprove,
  onReject,
  isUpdating
}) => {

  const handleItemClick = (id) => {
    const newSelected = selected.includes(id)
      ? selected.filter(item_id => item_id !== id)
      : [...selected, id];
    onSelectedChange(newSelected);
  };

  const handleSelectAll = () => {
    if (selected.length === transactions.length) {
      onSelectedChange([]); // Deselect all
    } else {
      onSelectedChange(transactions.map(t => t.id)); // Select all
    }
  };

  const numSelected = selected.length;
  const allSelected = numSelected === transactions.length && transactions.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="bg-white p-0 w-full sm:max-w-md border-r flex flex-col" hideCloseButton>
        <header className="flex-shrink-0 p-4 border-b border-slate-100" dir="rtl">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">
                  مراجعة العمليات
                </h2>
                <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full">
                    <ArrowRight className="w-6 h-6 text-slate-500" />
                </Button>
            </div>
        </header>
        <main className="flex-grow overflow-y-auto" dir="rtl">
          {transactions && transactions.length > 0 ? (
            <div className="divide-y divide-slate-100">
              <div className="flex items-center p-2.5 px-4 bg-white border-b border-slate-100 sticky top-0 z-10">
                  <Checkbox
                    id="select-all"
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    className="ml-4 h-5 w-5 rounded-md"
                  />
                  <label htmlFor="select-all" className="text-sm font-medium text-slate-600 cursor-pointer">
                    تحديد الكل ({transactions.length})
                  </label>
              </div>
              {transactions.map(t => (
                <div 
                  key={t.id} 
                  className={cn("flex items-center p-3 px-4 cursor-pointer hover:bg-slate-50", selected.includes(t.id) && 'bg-blue-50 hover:bg-blue-100/70 border-l-2 border-blue-500')}
                  onClick={() => handleItemClick(t.id)}
                >
                  <Checkbox
                    checked={selected.includes(t.id)}
                    onCheckedChange={() => handleItemClick(t.id)}
                    className="ml-4 h-5 w-5 rounded-md"
                  />
                  <div className="flex-1 text-right min-w-0"> {/* <--- THE FIX IS HERE */}
                    <p className="text-sm font-medium text-slate-800 truncate">{t.note}</p>
                    <p className="text-xs text-slate-500">{t.created_by}</p>
                  </div>
                  <div className="font-mono text-sm font-bold text-red-500 pr-4">
                    {formatCurrency(t.amount)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white">
              <p className="font-semibold text-slate-600">لا توجد عمليات للمراجعة</p>
              <p className="text-sm text-slate-400 mt-1">كل شيء على ما يرام!</p>
            </div>
          )}
        </main>
        {numSelected > 0 && (
            <footer className="flex-shrink-0 p-3 border-t border-slate-100 bg-white/80 backdrop-blur-sm" dir="rtl">
                <div className="grid grid-cols-2 gap-2">
                    <Button 
                        variant="outline"
                        className="h-11 text-base font-bold border-red-400 text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={onReject}
                        disabled={isUpdating}
                    >
                        {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5 ml-2" />}
                        رفض ({numSelected})
                    </Button>
                    <Button 
                        className="h-11 text-base font-bold bg-green-600 hover:bg-green-700 text-white"
                        onClick={onApprove}
                        disabled={isUpdating}
                    >
                        {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5 ml-2" />}
                        موافقة ({numSelected})
                    </Button>
                </div>
            </footer>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default ReviewSheet;
