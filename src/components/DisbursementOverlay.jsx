
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useFinances } from '@/hooks/useFinances'; // Assuming a hook to get finances
import { useKhazna } from '@/hooks/useKhazna'; // Assuming a hook to get safes/banks
import SearchableFinanceSelect from './SearchableFinanceSelect'; // Assuming this component exists
import { toast } from "@/components/ui/use-toast";


const Input = React.forwardRef((props, ref) => (
  <input {...props} ref={ref} className="h-11 px-3 w-full bg-slate-100 text-base border border-slate-200 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" />
));

const Textarea = React.forwardRef((props, ref) => (
    <textarea {...props} ref={ref} className="px-3 py-2 w-full bg-slate-100 text-base border border-slate-200 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" />
));

const DisbursementOverlay = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    financeId: '',
    amount: '',
    disbursementDate: new Date().toISOString().split('T')[0],
    sourceId: '',
    notes: '',
  });

  // Hypothetical hooks and data fetching
  const { finances } = useFinances({ status: 'approved' }); // Fetch approved finances
  const { khaznas } = useKhazna(); // Fetch safes and banks

  const handleSelectFinance = (finance) => {
    setFormData(prev => ({
      ...prev,
      financeId: finance.id,
      amount: finance.finance_amount // Auto-fill amount
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log("Submitting Disbursement:", formData);
    //
    // TODO: Add actual submission logic here
    //
    try {
        // await disburseFinance(formData); 
        toast({
            title: "تم الصرف بنجاح",
            description: `تم تسجيل صرف مبلغ ${formData.amount} لتمويل #${formData.financeId}.`,
            className: "bg-emerald-50 border-emerald-200 text-emerald-900"
        });
        setTimeout(() => {
            onClose();
            // Reset form after closing
            setTimeout(() => setFormData({
                financeId: '', amount: '', disbursementDate: new Date().toISOString().split('T')[0], sourceId: '', notes: '',
            }), 500);
        }, 1000);

    } catch (error) {
        toast({
            title: "خطأ في الصرف",
            description: "فشلت عملية تسجيل الصرف. يرجى المحاولة مرة أخرى.",
            variant: "destructive"
        });
    } finally {
        setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: '0%' }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 120, damping: 25, mass: 0.9 }}
          className="fixed inset-0 z-50 bg-slate-50 font-cairo"
          dir="rtl"
        >
          <div className="h-full flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between p-4 border-b border-slate-200 shrink-0">
              <h2 className="text-xl font-bold text-slate-800">صرف تمويل جديد</h2>
              <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-slate-200">
                <X className="w-6 h-6 text-slate-600" />
              </Button>
            </header>

            {/* Main Content & Form */}
            <main className="flex-grow overflow-y-auto p-6 md:p-8">
              <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
                
                {/* Finance Selection */}
                <div className="space-y-2">
                  <Label className="font-bold text-base">1. اختر التمويل</Label>
                  <p className="text-sm text-slate-500">ابحث عن التمويل المعتمد الذي ترغب في صرفه.</p>
                  <SearchableFinanceSelect 
                    finances={finances || []} 
                    onSelect={handleSelectFinance}
                    placeholder="ابحث برقم التمويل، اسم العميل، أو الرقم القومي..."
                  />
                </div>

                {/* Disbursement Details */}
                <div className="space-y-2">
                    <Label className="font-bold text-base">2. تفاصيل الصرف</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div>
                            <Label htmlFor="amount">مبلغ الصرف</Label>
                            <Input id="amount" type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0.00" required />
                        </div>
                        <div>
                            <Label htmlFor="disbursementDate">تاريخ الصرف</Label>
                            <Input id="disbursementDate" type="date" value={formData.disbursementDate} onChange={e => setFormData({...formData, disbursementDate: e.target.value})} required />
                        </div>
                    </div>
                </div>

                {/* Disbursement Source */}
                <div className="space-y-2">
                    <Label htmlFor="sourceId" className="font-bold text-base">3. منفذ الصرف</Label>
                    <p className="text-sm text-slate-500">اختر الخزينة أو الحساب البنكي الذي سيتم خصم المبلغ منه.</p>
                    <select
                        id="sourceId"
                        value={formData.sourceId}
                        onChange={e => setFormData({...formData, sourceId: e.target.value})}
                        className="h-11 px-3 w-full bg-slate-100 text-base border border-slate-200 rounded-lg"
                        required
                    >
                        <option value="" disabled>-- اختر منفذ الصرف --</option>
                        {khaznas?.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                    </select>
                </div>
                
                {/* Notes */}
                <div className="space-y-2">
                    <Label htmlFor="notes" className="font-bold text-base">4. ملاحظات (اختياري)</Label>
                    <Textarea id="notes" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={4} placeholder="أضف أي ملاحظات أو تفاصيل إضافية حول عملية الصرف..." />
                </div>

              </form>
            </main>

            {/* Footer */}
            <footer className="flex items-center justify-end p-4 border-t border-slate-200 bg-white/50 backdrop-blur-sm shrink-0">
                <div className="max-w-3xl mx-auto w-full flex justify-between items-center">
                    <Button variant="ghost" onClick={onClose} className="text-slate-700">
                        إلغاء
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || !formData.financeId} className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-8 rounded-lg">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "تأكيد الصرف"}
                    </Button>
                </div>
            </footer>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DisbursementOverlay;
