import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DollarSign } from 'lucide-react';

const PaymentModal = ({ isOpen, onClose, installment, onPaymentSubmit, loading }) => {
  const [amount, setAmount] = useState(
    installment ? Number(installment.installment_amount) - (Number(installment.total_paid_amount) || 0) : 0
  );
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  if (!installment) return null;

  const remaining = Number(installment.installment_amount) - (Number(installment.total_paid_amount) || 0);

  const handleSubmit = () => {
    if (amount <= 0) return;
    if (amount > remaining) {
      if(!window.confirm(`المبلغ المدخل (${amount}) أكبر من المبلغ المتبقي (${remaining}). هل أنت متأكد؟`)) return;
    }
    
    onPaymentSubmit(installment.id, amount, date, note);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            تسجيل دفعة للقسط: {installment.installment_label}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
           <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 flex justify-between items-center text-sm">
              <span className="text-emerald-800">المبلغ المتبقي:</span>
              <span className="font-bold text-emerald-700">{remaining.toLocaleString()} د.ل</span>
           </div>

           <div className="space-y-2">
              <Label>مبلغ الدفعة</Label>
              <input 
                type="number"
                className="w-full p-2 border rounded-lg"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
           </div>

           <div className="space-y-2">
              <Label>تاريخ الدفع</Label>
              <input 
                type="date"
                className="w-full p-2 border rounded-lg"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
           </div>

           <div className="space-y-2">
              <Label>ملاحظات (اختياري)</Label>
              <textarea 
                className="w-full p-2 border rounded-lg"
                rows="2"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
           </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || amount <= 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {loading ? "جاري التسجيل..." : "تأكيد الدفع"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;