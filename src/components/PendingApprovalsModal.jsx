import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  X, 
  CheckCircle, 
  XCircle, 
  ChevronRight, 
  ChevronLeft, 
  User, 
  FileText, 
  ShieldCheck, 
  Loader2, 
  ArrowLeft,
  Calendar,
  MapPin,
  StickyNote
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinance } from '@/hooks/useFinance';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/customSupabaseClient';

const StageIndicator = ({ currentStep, totalSteps }) => (
  <div className="flex items-center gap-2 justify-center py-3 bg-slate-50/50 border-b border-slate-100">
    {[...Array(totalSteps)].map((_, i) => (
      <div 
        key={i}
        className={cn(
          "h-1.5 rounded-full transition-all duration-500 ease-out",
          i + 1 === currentStep 
            ? "w-8 bg-blue-500 shadow-sm shadow-blue-200" 
            : i + 1 < currentStep 
              ? "w-2 bg-blue-200" 
              : "w-2 bg-slate-200"
        )}
      />
    ))}
  </div>
);

const DetailRow = ({ label, value, icon: Icon, isMono = false }) => (
  <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50 px-3 rounded-md transition-colors group">
    <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 group-hover:text-blue-600 transition-colors">
      {Icon && <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />}
      {label}
    </span>
    <span className={cn("text-xs font-semibold text-slate-800", isMono && "font-mono font-bold")}>
      {value || '-'}
    </span>
  </div>
);

const ImagePreview = ({ label, url }) => {
  if (!url) return null;
  return (
    <div className="space-y-1">
      <span className="text-[10px] text-slate-500 font-bold block px-1">{label}</span>
      <div className="h-32 w-full rounded-lg border border-slate-200 bg-slate-50 overflow-hidden relative group hover:border-blue-400 transition-all shadow-sm">
        <img src={url} alt={label} className="w-full h-full object-contain p-1" />
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="absolute inset-0 bg-slate-900/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 text-white text-xs font-bold backdrop-blur-sm"
        >
          عرض الصورة
        </a>
      </div>
    </div>
  );
};

const PendingApprovalsModal = ({ 
  isOpen, 
  onClose, 
  financeId, 
  onApprove, 
  onReject,
}) => {
  const [stage, setStage] = useState(1);
  const [fullData, setFullData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guarantees, setGuarantees] = useState([]);
  const [receipts, setReceipts] = useState({ names: [], images: {} });
  
  const { getFinanceById } = useFinance();
  const totalStages = 4;

  useEffect(() => {
    if (isOpen && financeId) {
      loadFullDetails();
      setStage(1);
    }
  }, [isOpen, financeId]);

  const loadFullDetails = async () => {
    setLoading(true);
    try {
      const { data: financeData } = await getFinanceById(financeId);
      setFullData(financeData);

      const { data: guaranteesData } = await supabase
        .from('guarantees')
        .select('*')
        .eq('finance_id', financeId);

      const personalGuarantees = guaranteesData.filter(g => g.guarantee_type === 'personal');
      setGuarantees(personalGuarantees);

      const receiptsBundle = guaranteesData.find(g => g.guarantee_type === 'receipts_bundle');
      
      let receiptNames = [];
      if (receiptsBundle) {
        const { data: rNames } = await supabase
          .from('receipt_guarantees')
          .select('receipt_name')
          .eq('guarantee_id', receiptsBundle.id);
        receiptNames = rNames?.map(r => r.receipt_name) || [];
        
        let otherData = {};
        try { otherData = JSON.parse(receiptsBundle.other_data || '{}'); } catch(e) {}

        setReceipts({
          names: receiptNames,
          images: {
            receipts: otherData.receipts_image,
            front: receiptsBundle.id_card_front,
            back: receiptsBundle.id_card_back
          }
        });
      } else {
        setReceipts({ names: [], images: {} });
      }

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const nextStage = () => setStage(p => Math.min(p + 1, totalStages));
  const prevStage = () => setStage(p => Math.max(p - 1, 1));

  const totalInstallmentAmount = fullData?.finance_installments?.reduce(
    (sum, item) => sum + Number(item.installment_amount || 0), 0
  ) || 0;
  
  const financeAmount = Number(fullData?.finance_amount || 0);
  const profitAmount = totalInstallmentAmount - financeAmount;

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white border-none shadow-2xl rounded-2xl h-[85vh] flex flex-col font-cairo" dir="rtl">
        
        {/* Header - Compact */}
        <div className="bg-slate-900 px-4 py-3 relative shrink-0 shadow-md z-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-white/10 p-1.5 rounded-lg border border-white/20 shadow-inner">
                <ShieldCheck className="w-4 h-4 text-blue-300" />
             </div>
             <div>
               <h2 className="text-sm font-bold text-white leading-tight">
                 اعتماد طلب تمويل
               </h2>
               <div className="flex items-center gap-1.5 text-blue-200/80 text-[10px] font-medium">
                  <span>الرقم المرجعي:</span>
                  <span className="font-mono text-white/90">{financeId?.slice(0, 8)}</span>
               </div>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors hover:bg-white/10 p-1.5 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-slate-50/30">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/80 backdrop-blur-sm z-20">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              <span className="text-sm font-bold text-slate-700">جاري التحميل...</span>
            </div>
          ) : (
            <div className="pb-16 h-full flex flex-col">
              <StageIndicator currentStep={stage} totalSteps={totalStages} />
              
              <div className="px-4 pb-4 pt-2">
                <AnimatePresence mode="wait">
                  
                  {/* Stage 1: Financial Overview */}
                  {stage === 1 && (
                    <motion.div 
                      key="stage1"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex flex-col gap-4"
                    >
                      {/* Compact Header Info (Removed Card) */}
                      <div className="text-center space-y-1.5 mb-2">
                         <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                           {fullData?.accounts?.name || 'اسم العميل غير متوفر'}
                         </h2>
                         
                         <div className="flex items-center justify-center gap-2">
                             <div className="text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200 text-xs font-bold shadow-sm">
                               {fullData?.finance_name}
                             </div>
                             <div className="text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200 text-xs font-medium flex items-center gap-1.5 shadow-sm">
                               <Calendar className="w-3 h-3" />
                               <span className="font-mono">
                                 {fullData?.finance_date ? new Date(fullData.finance_date).toLocaleDateString('en-GB') : '-'}
                               </span>
                             </div>
                         </div>
                      </div>
  
                      {/* Compact Amounts Comparison */}
                      <div className="flex items-center justify-center gap-3">
                          <div className="flex-1 p-3 rounded-xl border border-slate-200 bg-white text-center shadow-sm">
                              <div className="text-[10px] font-bold text-slate-400 mb-0.5 uppercase tracking-wider">أصل المبلغ</div>
                              <div className="text-lg font-black text-slate-900 font-mono tracking-tight">
                                  {financeAmount.toLocaleString()}
                              </div>
                          </div>
  
                          <ArrowLeft className="w-5 h-5 text-slate-300" />
  
                          <div className="flex-1 p-3 rounded-xl border border-blue-200 bg-blue-50/50 text-center shadow-sm ring-1 ring-blue-100">
                               <div className="text-[10px] font-bold text-blue-600 mb-0.5 uppercase tracking-wider">الإجمالي</div>
                               <div className="text-lg font-black text-blue-700 font-mono tracking-tight">
                                  {totalInstallmentAmount.toLocaleString()}
                               </div>
                               <div className="text-[9px] text-emerald-700 font-bold bg-emerald-100/50 inline-block px-1.5 rounded-sm">
                                  +{profitAmount.toLocaleString()}
                               </div>
                          </div>
                      </div>
  
                      {/* Compact Installments Table */}
                      <div className="border-t border-slate-100 pt-4">
                        <h3 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-blue-500" />
                          جدول الأقساط
                        </h3>
                        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                          <div className="grid grid-cols-3 bg-slate-50 p-2 text-[9px] font-bold text-slate-500 border-b border-slate-200 uppercase tracking-wider">
                            <div className="text-right pr-1">القسط</div>
                            <div className="text-center">التاريخ</div>
                            <div className="text-left pl-1">القيمة</div>
                          </div>
                          <div className="max-h-[180px] overflow-y-auto custom-scrollbar bg-white">
                            {fullData?.finance_installments?.map((inst, i) => (
                               <div key={i} className="grid grid-cols-3 p-2 border-b border-slate-50 last:border-0 hover:bg-blue-50/30 transition-colors text-[10px] group">
                                 <div className="font-bold text-slate-800 pr-1 group-hover:text-blue-600">{inst.installment_label || `قسط ${i+1}`}</div>
                                 <div className="text-center text-slate-500 font-mono font-medium">
                                    {new Date(inst.installment_date).toLocaleDateString('en-GB')}
                                 </div>
                                 <div className="text-left font-black text-slate-800 font-mono pl-1">
                                    {Number(inst.installment_amount).toLocaleString()}
                                  </div>
                               </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
  
                  {/* Stage 2: Customer Data */}
                  {stage === 2 && (
                    <motion.div 
                      key="stage2"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-4"
                    >
                       <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5 pb-2 border-b border-slate-50">
                          <User className="w-4 h-4 text-blue-600" />
                          البيانات الشخصية
                        </h3>
                        <div className="space-y-1">
                          <DetailRow label="الاسم" value={fullData?.accounts?.name} />
                          <DetailRow label="الهاتف 1" value={fullData?.accounts?.phone1} isMono />
                          <DetailRow label="الهاتف 2" value={fullData?.accounts?.phone2} isMono />
                          <DetailRow label="العنوان" value={fullData?.accounts?.address} icon={MapPin} />
                          <DetailRow label="الوظيفة" value={fullData?.accounts?.job} />
                          <DetailRow label="عنوان العمل" value={fullData?.accounts?.job_address} icon={MapPin} />
                        </div>
                       </div>
  
                       <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                          <h3 className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                            إثبات الشخصية
                          </h3>
                          <div className="grid grid-cols-2 gap-3">
                             <ImagePreview label="البطاقة (أمام)" url={fullData?.accounts?.id_card_front || fullData?.accounts?.id_card_image} />
                             <ImagePreview label="البطاقة (خلف)" url={fullData?.accounts?.id_card_back} />
                          </div>
                       </div>
                    </motion.div>
                  )}
  
                  {/* Stage 3: Guarantees */}
                  {stage === 3 && (
                    <motion.div 
                      key="stage3"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-4"
                    >
                      {guarantees.length > 0 ? guarantees.map((g, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
                          <div className="absolute top-0 right-0 bg-slate-100 text-slate-600 text-[9px] px-3 py-1 rounded-bl-lg font-bold border-b border-l border-slate-200">
                            ضامن #{idx + 1}
                          </div>
                          <div className="mt-5 space-y-1">
                            <DetailRow label="الاسم" value={g.name} />
                            <DetailRow label="الصلة" value={g.relationship} />
                            <DetailRow label="الهاتف" value={g.phone} isMono />
                            <DetailRow label="الرقم القومي" value={g.national_id} isMono />
                            <DetailRow label="الوظيفة" value={g.job} />
                            <DetailRow label="عنوان العمل" value={g.job_address} icon={MapPin} />
                          </div>
                          <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-50">
                             <ImagePreview label="البطاقة (أمام)" url={g.id_card_front} />
                             <ImagePreview label="البطاقة (خلف)" url={g.id_card_back} />
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center">
                          <ShieldCheck className="w-8 h-8 text-slate-300 mb-2" />
                          <p className="text-sm font-bold text-slate-500">لا يوجد ضامنين</p>
                        </div>
                      )}
                    </motion.div>
                  )}
  
                  {/* Stage 4: Attachments */}
                  {stage === 4 && (
                    <motion.div 
                      key="stage4"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-4"
                    >
                       <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                          <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center gap-1.5 pb-2 border-b border-slate-50">
                            <FileText className="w-4 h-4 text-blue-600" />
                            إيصالات الأمانة
                          </h3>
                          
                          {receipts.names.length > 0 ? (
                            <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                              <span className="text-[10px] font-bold text-slate-400 block mb-2 uppercase tracking-wider">الموقعين:</span>
                              <div className="flex flex-wrap gap-1.5">
                                {receipts.names.map((name, i) => (
                                  <span key={i} className="px-2 py-1 bg-white text-slate-700 border border-slate-200 rounded text-xs font-bold shadow-sm">
                                    {name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center mb-4">
                               <span className="text-xs font-semibold text-slate-400">لا توجد أسماء مسجلة</span>
                            </div>
                          )}
                          
                          <div className="space-y-4">
                             <ImagePreview label="صورة الإيصالات المجمعة" url={receipts.images.receipts} />
                             <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-50">
                                <ImagePreview label="بطاقة الضامن (أمام)" url={receipts.images.front} />
                                <ImagePreview label="بطاقة الضامن (خلف)" url={receipts.images.back} />
                             </div>
                          </div>
                       </div>
                    </motion.div>
                  )}
  
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-white border-t border-slate-100 shadow-[0_-5px_20px_-10px_rgba(0,0,0,0.05)] z-30">
           <div className="flex gap-3 max-w-2xl mx-auto w-full">
             {stage > 1 ? (
               <Button onClick={prevStage} variant="outline" className="h-10 w-12 rounded-lg p-0 shrink-0 border-slate-200 hover:bg-slate-50 text-slate-600 shadow-sm">
                 <ChevronRight className="w-5 h-5" />
               </Button>
             ) : (
               <div className="w-12 shrink-0"></div> 
             )}
             
             {stage < totalStages ? (
                 <Button onClick={nextStage} className="flex-1 bg-slate-900 hover:bg-slate-800 h-10 rounded-lg text-sm font-bold text-white shadow-md transition-all">
                   التالي
                   <ChevronLeft className="w-4 h-4 mr-2" />
                 </Button>
             ) : (
               <div className="flex-1 flex gap-2">
                  <Button 
                    variant="ghost" 
                    className="flex-1 h-10 rounded-lg text-xs font-bold bg-white text-red-500 hover:bg-red-50 border border-red-200 shadow-sm"
                    onClick={onReject}
                  >
                    <XCircle className="w-4 h-4 ml-1.5" />
                    رفض
                  </Button>
                  <Button 
                    className="flex-[1.5] h-10 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200"
                    onClick={onApprove}
                  >
                    <CheckCircle className="w-4 h-4 ml-1.5" />
                    اعتماد
                  </Button>
               </div>
             )}
           </div>
        </div>

      </DialogContent>
    </Dialog>
  );
};

export default PendingApprovalsModal;