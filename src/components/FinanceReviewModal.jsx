
import React, { useEffect, useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldCheck, XCircle, AlertTriangle, CheckCircle, FileText, Users, FileImage, LayoutList } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useFinance } from '@/hooks/useFinance';
import { useFinanceCalculations } from '@/hooks/useFinanceCalculations';
import DocumentsReviewTab from './DocumentsReviewTab';
import GuarantorsReviewTab from './GuarantorsReviewTab';
import AgreementsReviewTab from './AgreementsReviewTab';

const FinanceReviewModal = ({ isOpen, onClose, financeId, onSuccess, currentUser }) => {
  const [finance, setFinance] = useState(null);
  const [guarantors, setGuarantors] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  
  const { getFinanceById, updateFinanceStatus } = useFinance();
  const { calculateTotalInstallmentsAmount, calculateProfit } = useFinanceCalculations();

  useEffect(() => {
    if (isOpen && financeId) {
      loadFinance();
      loadRelatedData();
      setActiveTab('summary');
    } else {
      setFinance(null);
      setGuarantors([]);
      setAgreements([]);
    }
  }, [isOpen, financeId]);

  const loadFinance = async () => {
    const { data } = await getFinanceById(financeId);
    if (data) setFinance(data);
  };

  const loadRelatedData = async () => {
    setLoadingData(true);
    try {
      // Fetch Guarantors with account join
      const { data: guarantorsData } = await supabase
        .from('guarantees')
        .select(`
           *,
           accounts:guarantor_account_id (*)
        `)
        .eq('finance_contract_id', financeId) // Updated column
        .neq('guarantee_type', 'receipts_bundle');
      
      if (guarantorsData) setGuarantors(guarantorsData);

      // Fetch Agreements
      const { data: agreementsData } = await supabase
        .from('finance_agreements')
        .select('*')
        .eq('finance_id', financeId);
        
      if (agreementsData) setAgreements(agreementsData);
    } catch (error) {
      console.error('Error fetching related data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('هل أنت متأكد من الموافقة على طلب التمويل هذا؟')) return;
    
    const { error } = await updateFinanceStatus(financeId, 'approved', currentUser);
    if (!error) {
      onSuccess();
      onClose();
    }
  };

  const handleReject = async () => {
    if (!showRejectInput) {
      setShowRejectInput(true);
      return;
    }
    
    if (!rejectReason.trim()) return;

    const { error } = await updateFinanceStatus(financeId, 'rejected', currentUser, rejectReason);
    if (!error) {
      onSuccess();
      onClose();
    }
  };

  if (!finance) return null;

  const totalAmount = calculateTotalInstallmentsAmount(finance.finance_installments);
  const profit = calculateProfit(finance.finance_amount, finance.finance_installments);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-white h-[90vh] sm:h-auto flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-stone-100 bg-stone-50/50">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            مراجعة طلب تمويل
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col w-full" dir="rtl">
            <div className="px-6 pt-4">
              <TabsList className="w-full justify-start bg-stone-100 p-1 rounded-lg h-auto">
                <TabsTrigger value="summary" className="flex-1 text-xs py-2 gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <LayoutList className="w-3.5 h-3.5" />
                  الملخص
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex-1 text-xs py-2 gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <FileImage className="w-3.5 h-3.5" />
                  المستندات
                </TabsTrigger>
                <TabsTrigger value="guarantors" className="flex-1 text-xs py-2 gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Users className="w-3.5 h-3.5" />
                  الضامنون
                </TabsTrigger>
                <TabsTrigger value="agreements" className="flex-1 text-xs py-2 gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <FileText className="w-3.5 h-3.5" />
                  العقود
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <TabsContent value="summary" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Summary Card */}
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <p className="text-xs text-stone-500">اسم التمويل</p>
                        <p className="font-bold text-stone-800 text-sm">{finance.finance_name}</p>
                    </div>
                    <div>
                        <p className="text-xs text-stone-500">المستفيد</p>
                        <p className="font-bold text-stone-800 text-sm">{finance.accounts?.name}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-t border-stone-200 pt-4">
                    <div className="text-center">
                        <p className="text-xs text-stone-500">رأس المال</p>
                        <p className="font-bold text-stone-800 text-sm">{Number(finance.finance_amount).toLocaleString()} د.ل</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-stone-500">إجمالي العائد</p>
                        <p className="font-bold text-indigo-600 text-sm">{totalAmount.toLocaleString()} د.ل</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-stone-500">صافي الربح</p>
                        <p className="font-bold text-emerald-600 text-sm">+{profit.toLocaleString()} د.ل</p>
                    </div>
                  </div>
                </div>

                {/* Installments Preview */}
                <div>
                  <h4 className="font-bold text-sm mb-2 text-stone-700">جدول الأقساط المقترح</h4>
                  <div className="border rounded-lg overflow-hidden max-h-[250px] overflow-y-auto text-sm scrollbar-thin scrollbar-thumb-stone-200">
                    <table className="w-full">
                      <thead className="bg-stone-100 sticky top-0 z-10">
                        <tr>
                          <th className="p-2 text-right text-xs font-bold text-stone-600">#</th>
                          <th className="p-2 text-right text-xs font-bold text-stone-600">التاريخ</th>
                          <th className="p-2 text-left text-xs font-bold text-stone-600">المبلغ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {finance.finance_installments?.map((inst) => (
                          <tr key={inst.id} className="hover:bg-stone-50">
                            <td className="p-2 text-xs font-mono text-stone-500">{inst.installment_number}</td>
                            <td className="p-2 text-xs">{new Date(inst.installment_date).toLocaleDateString('ar-LY')}</td>
                            <td className="p-2 text-left font-bold text-xs">{Number(inst.installment_amount).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="mt-0">
                <DocumentsReviewTab finance={finance} />
              </TabsContent>

              <TabsContent value="guarantors" className="mt-0">
                <GuarantorsReviewTab guarantors={guarantors} loading={loadingData} />
              </TabsContent>

              <TabsContent value="agreements" className="mt-0">
                <AgreementsReviewTab agreements={agreements} loading={loadingData} />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="border-t border-stone-100 p-4 bg-stone-50/50 space-y-4 shrink-0">
          {showRejectInput && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="text-sm font-medium text-rose-700 mb-1 block">سبب الرفض:</label>
              <textarea 
                className="w-full p-2 border border-rose-200 bg-rose-50 rounded-lg text-sm focus:ring-rose-500 outline-none"
                rows="2"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="يرجى توضيح سبب الرفض..."
                autoFocus
              />
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {!showRejectInput ? (
              <>
                <Button variant="outline" onClick={onClose} className="border-stone-200">إلغاء</Button>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button 
                      onClick={handleReject}
                      className="flex-1 sm:flex-initial bg-rose-100 text-rose-700 hover:bg-rose-200 border-0 shadow-none"
                  >
                      <XCircle className="w-4 h-4 mr-2" />
                      رفض الطلب
                  </Button>
                  <Button 
                      onClick={handleApprove}
                      className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      موافقة واعتماد
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex w-full gap-2">
                <Button variant="ghost" onClick={() => setShowRejectInput(false)} className="flex-1">تراجع</Button>
                <Button onClick={handleReject} variant="destructive" className="flex-1 gap-2">
                  <XCircle className="w-4 h-4" />
                  تأكيد الرفض
                </Button>
              </div>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FinanceReviewModal;
