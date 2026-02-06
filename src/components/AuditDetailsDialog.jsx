import React, { useState } from 'react';
import { ShieldCheck, X, Camera, Check, AlertTriangle, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const AuditDetailsDialog = ({ audit, isOpen, onClose, onResolve }) => {
  const [resolving, setResolving] = useState(false);
  const { toast } = useToast();

  if (!audit) return null;

  // Parse images JSON safely
  let images = {};
  try {
    images = typeof audit.proof_images === 'string' 
      ? JSON.parse(audit.proof_images) 
      : (audit.proof_images || {});
  } catch (e) { console.error("Error parsing images", e); }

  const getImageUrl = (path) => {
    if (!path) return null;
    const { data } = supabase.storage.from('audit-proofs').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleResolve = async () => {
    if (Math.abs(audit.difference) < 0.01) return;
    setResolving(true);

    try {
      const type = audit.difference < 0 ? 'expense' : 'income';
      const note = `تسوية فروقات جرد (Audit #${audit.id.slice(0,6)})`;
      
      const { error: txnError } = await supabase.from('transactions').insert([{
        amount: Math.abs(audit.difference),
        type: type,
        note: note,
        date: new Date().toISOString(),
        created_by: 'SYSTEM (Admin Resolved)',
        status: 'approved'
      }]);

      if (txnError) throw txnError;

      const { error: auditError } = await supabase
        .from('audit_requests')
        .update({ status: 'resolved' })
        .eq('id', audit.id);

      if (auditError) throw auditError;

      toast({
        title: "تمت التسوية",
        description: "تم إنشاء عملية تصحيحية وتحديث حالة الجرد",
        className: "bg-emerald-50 text-emerald-900 border-emerald-200"
      });

      onResolve();
      onClose();
    } catch (error) {
      console.error(error);
      toast({ title: "خطأ", description: "فشل عملية التسوية", variant: "destructive" });
    } finally {
      setResolving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-white rounded-3xl border-none p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <div className={`p-6 text-white shrink-0 ${audit.status === 'discrepancy' ? 'bg-amber-500' : 'bg-stone-800'}`}>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">تفاصيل الجرد #{audit.id.slice(0, 4)}</DialogTitle>
                <p className="text-white/80 text-xs font-medium mt-1">
                  بواسطة: {audit.completed_by} • {new Date(audit.completed_at).toLocaleDateString('ar-SA')}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <DetailCard label="الكاش (الخزنة)" value={audit.cash_amount} />
            <DetailCard label="المحفظة 1" value={audit.wallet1_amount} />
            <DetailCard label="المحفظة 2" value={audit.wallet2_amount} />
            <DetailCard label="غير مسجل (خصم)" value={audit.unrecorded_amount} isDeduction />
          </div>

          <div className="bg-stone-50 p-4 rounded-xl space-y-3 border border-stone-100">
            <div className="flex justify-between items-center pb-3 border-b border-stone-200">
              <span className="text-sm font-bold text-stone-500">الرصيد الفعلي (المعدود)</span>
              <span className="text-lg font-black text-stone-800">{Number(audit.total_counted).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-stone-400 font-bold">رصيد النظام (المتوقع)</span>
              <span className="text-stone-600 font-mono">{Number(audit.system_balance).toLocaleString()}</span>
            </div>
            
            <div className={`flex justify-between items-center pt-2 ${audit.difference === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
              <span className="font-bold text-sm flex items-center gap-2">
                {audit.difference !== 0 && <AlertTriangle className="w-4 h-4" />}
                الفارق
              </span>
              <span className="font-black text-xl dir-ltr">
                {audit.difference > 0 ? '+' : ''}{Number(audit.difference).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">مرفقات التوثيق</p>
            <div className="grid grid-cols-4 gap-2">
              <ProofImage label="كاش" url={getImageUrl(images.cash)} />
              <ProofImage label="محفظة 1" url={getImageUrl(images.wallet1)} />
              <ProofImage label="محفظة 2" url={getImageUrl(images.wallet2)} />
              <ProofImage label="غير مسجل" url={getImageUrl(images.unrecorded)} />
            </div>
          </div>

          {audit.status === 'discrepancy' && (
            <Button 
              onClick={handleResolve} 
              disabled={resolving}
              className="w-full py-6 text-lg font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-200"
            >
              {resolving ? "جاري المعالجة..." : "تسوية الفروقات وتصحيح الرصيد"}
            </Button>
          )}
          
          {audit.status === 'resolved' && (
             <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-center text-sm font-bold flex items-center justify-center gap-2">
               <Check className="w-4 h-4" />
               تمت التسوية وتصحيح الرصيد
             </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DetailCard = ({ label, value, isDeduction }) => (
  <div className="p-3 bg-white border border-stone-100 rounded-xl shadow-sm">
    <p className="text-[10px] text-stone-400 font-bold mb-1 flex justify-between">
      {label}
      {isDeduction && <span className="text-rose-500">(خصم)</span>}
    </p>
    <p className="text-lg font-bold text-stone-800">{Number(value).toLocaleString()}</p>
  </div>
);

const ProofImage = ({ label, url }) => {
  if (!url) return (
    <div className="aspect-square bg-stone-50 rounded-lg flex flex-col items-center justify-center border border-stone-100 text-stone-300">
      <Camera className="w-5 h-5 mb-1" />
      <span className="text-[9px]">{label}</span>
    </div>
  );

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="aspect-square relative group overflow-hidden rounded-lg border border-stone-200 block">
      <img src={url} alt={label} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <ExternalLink className="w-5 h-5 text-white" />
      </div>
      <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] text-center py-0.5">{label}</span>
    </a>
  );
};

export default AuditDetailsDialog;