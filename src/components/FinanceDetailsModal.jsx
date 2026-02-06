
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Wallet,
  LayoutList,
  Shield,
  FileText,
  Banknote,
  MessageSquare,
  FileImage,
  Users,
  ScrollText
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFinance } from '@/hooks/useFinance';
import { useFinanceCalculations } from '@/hooks/useFinanceCalculations';
import { useToast } from '@/components/ui/use-toast';

// Components
import FinanceDetailsTopCard from './FinanceDetailsTopCard';

// Tabs
import InstallmentsTabContent from './InstallmentsTabContent';
import PaymentHistoryTab from './PaymentHistoryTab';
import CustomerGuarantorsTab from './CustomerGuarantorsTab';
import AttachmentsTabContent from './AttachmentsTabContent';
import NotesTabContent from './NotesTabContent';
// New Tabs
import DocumentsTabContent from './DocumentsTabContent';
import GuarantorsDisplayTab from './GuarantorsDisplayTab';
import AgreementsTabContent from './AgreementsTabContent';

const FinanceDetailsModal = ({ isOpen, onClose, financeId, currentUser }) => {
  const [finance, setFinance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('installments');

  const { getFinanceById } = useFinance();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && financeId) {
      fetchFullDetails();
    } else {
      setFinance(null);
      setActiveTab('installments');
    }
  }, [isOpen, financeId]);

  const fetchFullDetails = async () => {
    setLoading(true);
    try {
      const { data } = await getFinanceById(financeId);
      setFinance(data);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "تعذر تحميل تفاصيل التمويل",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] md:max-w-4xl w-full h-[95vh] md:h-[90vh] p-0 gap-0 bg-[#f8f9fc] rounded-xl overflow-hidden shadow-2xl flex flex-col font-cairo border-none outline-none" dir="rtl">
        
        {/* Header */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-md shrink-0">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white border border-white/10 shadow-inner backdrop-blur-sm">
                 <Wallet className="w-4 h-4" />
              </div>
              <div>
                 <h2 className="text-sm font-bold text-white leading-tight">تفاصيل التمويل</h2>
                 <p className="text-[10px] text-slate-400 font-mono tracking-wide">#{financeId?.slice(0,8)}</p>
              </div>
           </div>
           
           <Button 
              onClick={onClose}
              variant="ghost" 
              className="rounded-full h-8 w-8 p-0 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
           >
              <X className="w-4 h-4" />
           </Button>
        </div>

        {loading ? (
           <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin mb-3"></div>
              <p className="text-slate-400 font-bold text-xs animate-pulse">جاري تحميل البيانات...</p>
           </div>
        ) : (
          <div className="flex-1 h-full bg-[#f8f9fc] overflow-hidden flex flex-col">
             <div className="flex-1 overflow-y-auto">
               <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto pb-10">
                  
                  {/* Customer Info Section */}
                  {finance?.accounts && (
                    <div className="text-center space-y-1.5 py-1">
                        <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                          {finance.accounts.nickname 
                              ? `${finance.accounts.nickname} (${finance.accounts.name})`
                              : finance.accounts.name
                          }
                        </h2>
                        <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-500">
                            <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-100 text-slate-600" dir="ltr">{finance.accounts.phone1}</span>
                            {finance.accounts.address && (
                              <>
                                <span className="text-slate-300">|</span>
                                <span>{finance.accounts.address}</span>
                              </>
                            )}
                        </div>
                    </div>
                  )}

                  {/* Finance Summary Card */}
                  <FinanceDetailsTopCard 
                    finance={finance}
                  />

                  {/* Main Tabs Section */}
                  <div className="space-y-4">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir="rtl">
                        <div className="sticky top-0 z-20 bg-[#f8f9fc]/95 backdrop-blur-sm pb-2 pt-1 -mx-2 px-2">
                          <ScrollArea className="w-full" dir="rtl">
                             <TabsList className="bg-slate-100/50 h-auto w-full inline-flex justify-start gap-1 p-1 rounded-lg">
                                {[
                                  { id: 'installments', label: 'الأقساط', icon: LayoutList },
                                  { id: 'payments', label: 'المدفوعات', icon: Banknote },
                                  { id: 'info', label: 'البيانات', icon: Shield },
                                  { id: 'documents', label: 'المستندات', icon: FileImage },
                                  { id: 'guarantors_docs', label: 'الضامنين', icon: Users },
                                  { id: 'agreements', label: 'العقود', icon: ScrollText },
                                  { id: 'attachments', label: 'المرفقات', icon: FileText },
                                  { id: 'notes', label: 'الملاحظات', icon: MessageSquare },
                                ].map(tab => (
                                  <TabsTrigger 
                                      key={tab.id}
                                      value={tab.id} 
                                      className="px-3 py-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-slate-200/50 border border-transparent font-bold text-slate-500 text-xs gap-2 transition-all min-w-fit"
                                  >
                                      <tab.icon className="w-3.5 h-3.5" />
                                      {tab.label}
                                  </TabsTrigger>
                                ))}
                             </TabsList>
                          </ScrollArea>
                        </div>

                        <div className="min-h-[350px] mt-2">
                          <TabsContent value="installments" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                              <InstallmentsTabContent 
                                  installments={finance?.finance_installments} 
                                  currentUser={currentUser}
                                  onRefresh={fetchFullDetails}
                              />
                          </TabsContent>
                          
                          <TabsContent value="payments" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                              <PaymentHistoryTab 
                                financeId={financeId}
                                currentUser={currentUser}
                                installments={finance?.finance_installments}
                                onRefresh={fetchFullDetails}
                              />
                          </TabsContent>

                          <TabsContent value="info" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                              <CustomerGuarantorsTab finance={finance} />
                          </TabsContent>

                          <TabsContent value="documents" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                              <DocumentsTabContent finance={finance} />
                          </TabsContent>

                          <TabsContent value="guarantors_docs" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                              <GuarantorsDisplayTab finance={finance} />
                          </TabsContent>

                          <TabsContent value="agreements" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                              <AgreementsTabContent finance={finance} />
                          </TabsContent>

                          <TabsContent value="attachments" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                              <AttachmentsTabContent financeId={financeId} />
                          </TabsContent>

                          <TabsContent value="notes" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                              <NotesTabContent finance={finance} currentUser={currentUser} />
                          </TabsContent>
                        </div>
                    </Tabs>
                  </div>
               </div>
             </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FinanceDetailsModal;
