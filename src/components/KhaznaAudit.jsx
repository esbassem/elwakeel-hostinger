import React, { useState, useRef } from 'react';
import { Camera, CheckCircle, ShieldAlert, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const KhaznaAudit = ({ isOpen, auditRequest, currentBalance, currentUser, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    cash: '',
    wallet1: '',
    wallet2: '',
    unrecorded: '',
    cashProof: null,
    wallet1Proof: null,
    wallet2Proof: null,
    unrecordedProof: null,
  });

  // Refs for hidden file inputs
  const cashInputRef = useRef(null);
  const w1InputRef = useRef(null);
  const w2InputRef = useRef(null);
  const unrecInputRef = useRef(null);

  if (!auditRequest) return null;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (field, e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, [field]: file }));
    }
  };

  const calculateTotal = () => {
    return (
      (parseFloat(formData.cash) || 0) +
      (parseFloat(formData.wallet1) || 0) +
      (parseFloat(formData.wallet2) || 0) -
      (parseFloat(formData.unrecorded) || 0)
    );
  };

  const isFormValid = () => {
    // All amounts must be entered and all proofs must be provided (actual files)
    const amountsFilled = 
      formData.cash !== '' && 
      formData.wallet1 !== '' && 
      formData.wallet2 !== '' && 
      formData.unrecorded !== '';
      
    const proofsProvided = 
      formData.cashProof && 
      formData.wallet1Proof && 
      formData.wallet2Proof && 
      formData.unrecordedProof;

    return amountsFilled && proofsProvided;
  };

  const uploadProof = async (file, prefix) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${auditRequest.id}/${prefix}_${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('audit-proofs')
      .upload(fileName, file);

    if (error) throw error;
    return data.path;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;

    setLoading(true);
    const totalCounted = calculateTotal();
    const difference = totalCounted - currentBalance;
    const isDiscrepancy = Math.abs(difference) > 0.01;

    try {
      // 1. Upload Images
      const proofs = {};
      const fields = [
        { key: 'cashProof', prefix: 'cash' },
        { key: 'wallet1Proof', prefix: 'w1' },
        { key: 'wallet2Proof', prefix: 'w2' },
        { key: 'unrecordedProof', prefix: 'unrec' }
      ];

      for (const field of fields) {
        if (formData[field.key]) {
          proofs[field.key] = await uploadProof(formData[field.key], field.prefix);
        }
      }

      // 2. Update Audit Request
      const { error: auditError } = await supabase
        .from('audit_requests')
        .update({
          status: isDiscrepancy ? 'discrepancy' : 'completed',
          completed_at: new Date().toISOString(),
          completed_by: currentUser?.name || 'Unknown',
          cash_amount: parseFloat(formData.cash) || 0,
          wallet1_amount: parseFloat(formData.wallet1) || 0,
          wallet2_amount: parseFloat(formData.wallet2) || 0,
          unrecorded_amount: parseFloat(formData.unrecorded) || 0,
          total_counted: totalCounted,
          system_balance: currentBalance,
          difference: difference,
          proof_images: JSON.stringify({
             cash: proofs.cashProof,
             wallet1: proofs.wallet1Proof,
             wallet2: proofs.wallet2Proof,
             unrecorded: proofs.unrecordedProof
          })
        })
        .eq('id', auditRequest.id);

      if (auditError) throw auditError;

      toast({
        title: isDiscrepancy ? "تم إنهاء الجرد (يوجد فروقات)" : "تم إنهاء الجرد بنجاح",
        description: isDiscrepancy 
          ? "تم تسجيل الجرد. سيقوم المدير بمراجعة الفروقات." 
          : "الأرصدة متطابقة تماماً. شكراً لك.",
        variant: isDiscrepancy ? "destructive" : "default",
        className: isDiscrepancy ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-emerald-50 border-emerald-200 text-emerald-900"
      });

      onComplete();

    } catch (error) {
      console.error(error);
      toast({ title: "خطأ", description: "تعذر رفع الملفات أو حفظ الجرد", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const total = calculateTotal();
  const diff = total - currentBalance;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md bg-stone-50 overflow-hidden border-none shadow-2xl p-0">
        <div className="bg-stone-900 p-6 text-white text-center">
          <div className="mx-auto w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-3">
             <ShieldAlert className="w-6 h-6 text-amber-400" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">مطلوب جرد الصندوق</DialogTitle>
            <p className="text-stone-400 text-sm mt-2">
              إجراء أمني إلزامي. يرجى إدخال المبالغ الفعلية مع رفع صور التوثيق.
            </p>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-4">
            <AuditField 
              label="النقدية في الخزنة (كاش)" 
              value={formData.cash} 
              onChange={(v) => handleInputChange('cash', v)}
              file={formData.cashProof}
              onFileSelect={(e) => handleFileSelect('cashProof', e)}
              inputRef={cashInputRef}
            />
            <AuditField 
              label="المحفظة الإلكترونية 1" 
              value={formData.wallet1} 
              onChange={(v) => handleInputChange('wallet1', v)}
              file={formData.wallet1Proof}
              onFileSelect={(e) => handleFileSelect('wallet1Proof', e)}
              inputRef={w1InputRef}
            />
            <AuditField 
              label="المحفظة الإلكترونية 2" 
              value={formData.wallet2} 
              onChange={(v) => handleInputChange('wallet2', v)}
              file={formData.wallet2Proof}
              onFileSelect={(e) => handleFileSelect('wallet2Proof', e)}
              inputRef={w2InputRef}
            />
            <div className="border-t border-stone-200 my-2 pt-2">
               <AuditField 
                 label="مبالغ غير مسجلة (فواتير خارجية)" 
                 value={formData.unrecorded} 
                 onChange={(v) => handleInputChange('unrecorded', v)}
                 file={formData.unrecordedProof}
                 onFileSelect={(e) => handleFileSelect('unrecordedProof', e)}
                 inputRef={unrecInputRef}
                 isDeduction
               />
            </div>
          </div>

          <div className="bg-stone-200 p-4 rounded-xl space-y-2">
             <div className="flex justify-between text-sm font-bold text-stone-600">
               <span>إجمالي المدخلات:</span>
               <span>{total.toLocaleString()}</span>
             </div>
             <div className="flex justify-between text-xs text-stone-500">
               <span>الرصيد المتوقع:</span>
               <span>{currentBalance.toLocaleString()}</span>
             </div>
             {Math.abs(diff) > 0.01 && (
               <div className={`flex justify-between text-sm font-black pt-2 border-t border-stone-300 ${diff < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                 <span>الفارق:</span>
                 <span dir="ltr">{diff > 0 ? '+' : ''}{diff.toLocaleString()}</span>
               </div>
             )}
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={loading || !isFormValid()}
            className={`w-full py-6 text-lg font-bold transition-all ${
              isFormValid() 
                ? 'bg-stone-900 hover:bg-stone-800' 
                : 'bg-stone-300 text-stone-500 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> جاري الرفع والحفظ...
              </span>
            ) : isFormValid() ? "اعتماد وإرسال" : "أكمل البيانات والصور أولاً"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AuditField = ({ label, value, onChange, file, onFileSelect, inputRef, isDeduction }) => (
  <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm focus-within:ring-2 focus-within:ring-stone-900/10 transition-all">
    <div className="flex justify-between items-center mb-1.5">
      <label className="text-xs font-bold text-stone-500 block">
        {label}
        {isDeduction && <span className="text-rose-500 text-[10px] mr-1">(يخصم)</span>}
      </label>
      {!file && <span className="text-[9px] text-rose-500 font-bold">* الصورة مطلوبة</span>}
    </div>
    <div className="flex gap-2">
      <input 
        type="number" 
        placeholder="0.00"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent font-bold text-lg outline-none text-stone-800 placeholder:text-stone-300"
      />
      
      <input 
        type="file" 
        ref={inputRef}
        accept="image/*"
        onChange={onFileSelect}
        className="hidden"
      />

      <button 
        onClick={() => inputRef.current?.click()}
        className={`h-10 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
          file 
            ? 'bg-emerald-500 text-white shadow-emerald-200 shadow-md' 
            : 'bg-stone-100 text-stone-400 hover:bg-stone-200 hover:text-stone-600'
        }`}
        title={file ? "تغيير الصورة" : "إرفاق صورة إثبات"}
      >
        {file ? (
          <>
            <CheckCircle className="w-5 h-5" />
            <span className="text-xs font-bold max-w-[60px] truncate">{file.name}</span>
          </>
        ) : (
          <Camera className="w-5 h-5" />
        )}
      </button>
    </div>
  </div>
);

export default KhaznaAudit;