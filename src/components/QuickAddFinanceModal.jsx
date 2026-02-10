import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar, Calculator, ArrowRight, User, AlertCircle } from 'lucide-react';
import { useAccounts } from '@/hooks/useAccounts';
import { useFinance } from '@/hooks/useFinance';

const QuickAddFinanceModal = ({ isOpen, onClose, onSuccess, currentUser }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    beneficiary_account_id: '',
    finance_name: '',
    finance_amount: '',
    finance_date: new Date().toISOString().split('T')[0],
    installments_count: 12,
    installment_amount: 0,
    first_installment_date: '',
  });

  const [generatedInstallments, setGeneratedInstallments] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const { fetchAccounts } = useAccounts();
  const { createFinance, loading } = useFinance();

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFormData({
        beneficiary_account_id: '',
        finance_name: '',
        finance_amount: '',
        finance_date: new Date().toISOString().split('T')[0],
        installments_count: 12,
        installment_amount: 0,
        first_installment_date: new Date().toISOString().split('T')[0],
      });
      loadAccounts();
    }
  }, [isOpen]);

  const loadAccounts = async () => {
    const { data } = await fetchAccounts({ search: searchTerm });
    if (data) setAccounts(data);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) loadAccounts();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const generateInstallments = () => {
    const count = parseInt(formData.installments_count);
    const amount = parseFloat(formData.installment_amount);
    const startDate = new Date(formData.first_installment_date);
    
    if (!count || !amount || isNaN(startDate.getTime())) return;

    const installments = [];
    for (let i = 0; i < count; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      
      installments.push({
        installment_number: i + 1,
        installment_label: `قسط ${i + 1}`,
        installment_amount: amount,
        installment_date: date.toISOString().split('T')[0],
        status: 'unpaid'
      });
    }
    setGeneratedInstallments(installments);
  };

  useEffect(() => {
    if (formData.installments_count && formData.installment_amount && formData.first_installment_date) {
      generateInstallments();
    }
  }, [formData.installments_count, formData.installment_amount, formData.first_installment_date]);

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.beneficiary_account_id || !formData.finance_name || generatedInstallments.length === 0) return;

    const financePayload = {
      beneficiary_account_id: formData.beneficiary_account_id,
      finance_name: formData.finance_name,
      finance_amount: parseFloat(formData.finance_amount),
      finance_date: formData.finance_date,
      total_amount: generatedInstallments.reduce((sum, i) => sum + parseFloat(i.installment_amount), 0)
    };

    const { error } = await createFinance(financePayload, generatedInstallments, currentUser);
    
    if (!error) {
      onSuccess();
    }
  };

  const totalReturn = generatedInstallments.reduce((sum, i) => sum + parseFloat(i.installment_amount || 0), 0);
  const profit = totalReturn - parseFloat(formData.finance_amount || 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-600" />
            طلب تمويل جديد
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {step === 1 ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>المستفيد</Label>
                  <select 
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20"
                    value={formData.beneficiary_account_id}
                    onChange={(e) => setFormData({...formData, beneficiary_account_id: e.target.value})}
                  >
                    <option value="">اختر المستفيد...</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.nickname || acc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>اسم التمويل / الغرض</Label>
                  <input
                    type="text"
                    className="w-full p-2.5 bg-white border border-stone-200 rounded-lg text-sm"
                    placeholder="مثال: تمويل سيارة، بضاعة..."
                    value={formData.finance_name}
                    onChange={(e) => setFormData({...formData, finance_name: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>قيمة التمويل (رأس المال)</Label>
                  <input
                    type="number"
                    className="w-full p-2.5 bg-white border border-stone-200 rounded-lg text-sm"
                    value={formData.finance_amount}
                    onChange={(e) => setFormData({...formData, finance_amount: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>تاريخ التمويل</Label>
                  <input
                    type="date"
                    className="w-full p-2.5 bg-white border border-stone-200 rounded-lg text-sm"
                    value={formData.finance_date}
                    onChange={(e) => setFormData({...formData, finance_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="border-t border-stone-100 pt-4">
                <h4 className="font-bold text-sm mb-3 text-stone-700">جدولة الأقساط</h4>
                <div className="grid grid-cols-3 gap-3">
                   <div className="space-y-1">
                      <Label className="text-xs">عدد الأقساط</Label>
                      <input
                        type="number"
                        className="w-full p-2 bg-stone-50 border border-stone-200 rounded text-sm"
                        value={formData.installments_count}
                        onChange={(e) => setFormData({...formData, installments_count: e.target.value})}
                      />
                   </div>
                   <div className="space-y-1">
                      <Label className="text-xs">قيمة القسط</Label>
                      <input
                        type="number"
                        className="w-full p-2 bg-stone-50 border border-stone-200 rounded text-sm"
                        value={formData.installment_amount}
                        onChange={(e) => setFormData({...formData, installment_amount: e.target.value})}
                      />
                   </div>
                   <div className="space-y-1">
                      <Label className="text-xs">بداية السداد</Label>
                      <input
                        type="date"
                        className="w-full p-2 bg-stone-50 border border-stone-200 rounded text-sm"
                        value={formData.first_installment_date}
                        onChange={(e) => setFormData({...formData, first_installment_date: e.target.value})}
                      />
                   </div>
                </div>
              </div>

              {/* Live Calculation Preview */}
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mt-2">
                 <div className="flex justify-between items-center text-sm mb-1">
                    <span className="text-stone-600">إجمالي المبلغ المستحق:</span>
                    <span className="font-bold text-indigo-700 text-lg">{totalReturn.toLocaleString()} د.ل</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-500">الربح المتوقع:</span>
                    <span className={`font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {profit > 0 ? '+' : ''}{profit.toLocaleString()} د.ل
                    </span>
                 </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
               <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 text-sm mb-2">
                  <div className="flex justify-between font-bold text-stone-700 mb-2">
                     <span>{formData.finance_name}</span>
                     <span>{parseFloat(formData.finance_amount).toLocaleString()} د.ل</span>
                  </div>
                  <div className="text-stone-500 text-xs">
                    جدول سداد مقترح لـ {generatedInstallments.length} أقساط
                  </div>
               </div>

               <div className="border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                 <table className="w-full text-sm">
                   <thead className="bg-stone-100 text-stone-600 sticky top-0">
                     <tr>
                       <th className="p-2 text-right">#</th>
                       <th className="p-2 text-right">الوصف</th>
                       <th className="p-2 text-right">التاريخ</th>
                       <th className="p-2 text-left">المبلغ</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-stone-100">
                     {generatedInstallments.map((inst, idx) => (
                       <tr key={idx} className="hover:bg-stone-50">
                         <td className="p-2 text-stone-400">{inst.installment_number}</td>
                         <td className="p-2">
                            <input 
                              type="text" 
                              value={inst.installment_label}
                              onChange={(e) => {
                                const newInst = [...generatedInstallments];
                                newInst[idx].installment_label = e.target.value;
                                setGeneratedInstallments(newInst);
                              }}
                              className="bg-transparent border-none w-full focus:ring-0 p-0 text-sm"
                            />
                         </td>
                         <td className="p-2">
                            <input 
                              type="date" 
                              value={inst.installment_date}
                              onChange={(e) => {
                                const newInst = [...generatedInstallments];
                                newInst[idx].installment_date = e.target.value;
                                setGeneratedInstallments(newInst);
                              }}
                              className="bg-transparent border-none w-full focus:ring-0 p-0 text-xs text-stone-500"
                            />
                         </td>
                         <td className="p-2 text-left font-medium">
                           {parseFloat(inst.installment_amount).toLocaleString()}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {step === 1 ? (
            <>
              <Button variant="outline" onClick={onClose}>إلغاء</Button>
              <Button 
                onClick={() => setStep(2)}
                disabled={!formData.beneficiary_account_id || !formData.finance_amount || generatedInstallments.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                متابعة <ArrowRight className="w-4 h-4 mr-2" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>رجوع</Button>
              <Button 
                onClick={handleSubmit}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {loading ? "جاري الحفظ..." : "تأكيد وإنشاء"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuickAddFinanceModal;