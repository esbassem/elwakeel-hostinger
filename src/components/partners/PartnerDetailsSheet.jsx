import { useState, useEffect, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '../ui/sheet';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { usePartners } from '../../hooks/usePartners';
import { Skeleton } from '../ui/skeleton';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';
import { Camera, ExternalLink } from 'lucide-react';

// --- Replicated InfoDisplayField from CreateInvoiceSheet.jsx ---
const InfoDisplayField = ({ label, value, isMono }) => (
    <div className="space-y-1.5">
        <Label className="font-semibold px-1 text-slate-800">{label}</Label>
        <div className="flex items-center h-12 bg-slate-100 border-slate-200 shadow-sm rounded-md px-3">
            <p className={cn("text-base text-slate-800", isMono && "font-mono", !value && "text-slate-400")}>
                {value || "--"}
            </p>
        </div>
    </div>
);

// --- Replicated ImageDisplayField from CreateInvoiceSheet.jsx ---
const ImageDisplayField = ({ label, imageUrl }) => (
    <div className="space-y-1.5">
        <Label className="font-semibold px-1 text-slate-800">{label}</Label>
        <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="block group">
            <div className="h-32 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center group-hover:border-blue-500 transition-colors relative">
                {imageUrl ? (
                    <>
                        <img src={imageUrl} alt={label} className="max-w-full max-h-full object-contain rounded-md p-1" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                           <ExternalLink className="w-8 h-8 text-white" />
                        </div>
                    </>
                ) : (
                    <div className="text-center text-slate-400">
                        <Camera className="w-8 h-8 mx-auto mb-1" />
                        <p className="text-xs font-semibold">لا توجد صورة</p>
                    </div>
                )}
            </div>
        </a>
    </div>
);

const PartnerDetailsSheet = ({ open, onClose, partnerId }) => {
  const [partner, setPartner] = useState(null);
  const { getPartnerById, loading } = usePartners();

  const fetchPartner = useCallback(async () => {
    if (partnerId) {
      const data = await getPartnerById(partnerId);
      setPartner(data);
    }
  }, [partnerId, getPartnerById]);

  useEffect(() => {
    if (open) {
      fetchPartner();
    } else {
      // Reset partner data when sheet is closed to show loading skeleton on next open
      setTimeout(() => setPartner(null), 300);
    }
  }, [open, fetchPartner]);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-auto max-h-[90vh] flex flex-col rounded-t-2xl border-t p-0">
        <header className="flex-shrink-0 p-3 bg-white border-b flex items-center justify-between">
            <h2 className="text-lg font-bold px-2">تفاصيل الشريك</h2>
            <Button variant="ghost" onClick={onClose}>إغلاق</Button>
        </header>

        <ScrollArea className="flex-grow p-4">
          {loading || !partner ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <div className="grid grid-cols-2 gap-4 pt-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
                <InfoDisplayField label="الاسم" value={partner.name} />
                <div className="grid grid-cols-2 gap-4">
                    <InfoDisplayField label="اللقب" value={partner.nickname} />
                    <InfoDisplayField label="النوع" value={partner.account_type} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <InfoDisplayField label="الهاتف 1" value={partner.phone1} isMono />
                    <InfoDisplayField label="الهاتف 2" value={partner.phone2} isMono />
                </div>
                <InfoDisplayField label="العنوان" value={partner.address} />
                <InfoDisplayField label="الرقم القومي" value={partner.national_id} isMono />
                
                 <div className="space-y-1.5">
                    <Label className="font-semibold px-1 text-slate-800">ملاحظات</Label>
                    <div className="w-full p-3 min-h-[100px] text-base bg-slate-100 border-slate-200 rounded-md shadow-sm">
                       {partner.notes || <span className="text-slate-400">--</span>}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                    <ImageDisplayField label="صورة البطاقة (وجه)" imageUrl={partner.id_card_front} />
                    <ImageDisplayField label="صورة البطاقة (ظهر)" imageUrl={partner.id_card_back} />
                </div>
            </div>
          )}
        </ScrollArea>
        <footer className="p-3 bg-white/80 backdrop-blur-sm border-t">
            <SheetClose asChild>
                <Button variant="outline" className="w-full h-12 text-base font-bold" onClick={onClose}>إغلاق</Button>
            </SheetClose>
        </footer>
      </SheetContent>
    </Sheet>
  );
};

export default PartnerDetailsSheet;
