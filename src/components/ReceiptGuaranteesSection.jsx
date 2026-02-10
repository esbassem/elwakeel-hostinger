
import React, { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FileText, Image as ImageIcon, Loader2, X, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { cn } from '@/lib/utils';

const ImageUploader = ({ url, onUpload, onRemove, label }) => {
  const [uploading, setUploading] = React.useState(false);

  const handleFileChange = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        alert('الرجاء اختيار ملف صورة صالح');
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `receipt_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error } = await supabase.storage.from('finance-attachments').upload(fileName, file);

      if (error) throw error;

      const { data } = supabase.storage.from('finance-attachments').getPublicUrl(fileName);
      onUpload(data.publicUrl);
    } catch (error) {
      console.error('Error uploading:', error);
      alert('فشل رفع الصورة');
    } finally {
      setUploading(false);
    }
  };

  if (url) {
    return (
      <div className="relative w-full h-20 rounded-lg border border-stone-200 overflow-hidden group">
        <img src={url} alt="Receipt" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
          <Button 
            variant="destructive" 
            size="icon" 
            className="h-6 w-6 rounded-full"
            onClick={onRemove}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-20 rounded-lg border border-dashed border-stone-300 hover:bg-stone-50 hover:border-blue-300 transition-all flex flex-col items-center justify-center cursor-pointer bg-white group">
      <input 
        type="file" 
        accept="image/*"
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
        onChange={handleFileChange}
        disabled={uploading}
      />
      {uploading ? (
        <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      ) : (
        <>
          <ImageIcon className="w-4 h-4 text-stone-300 group-hover:text-blue-500 transition-colors mb-1" />
          <span className="text-[9px] text-stone-400 group-hover:text-stone-600">{label}</span>
        </>
      )}
    </div>
  );
};

const ReceiptGuaranteesSection = ({ receipts = [], onChange }) => {
  const handleCountChange = (e) => {
    const count = parseInt(e.target.value) || 0;
    const currentReceipts = [...receipts];
    
    if (count > currentReceipts.length) {
      // Add new receipts
      const toAdd = count - currentReceipts.length;
      for (let i = 0; i < toAdd; i++) {
        currentReceipts.push({
          name: '',
          amount: '', // optional
          images: ['', '', ''] // 3 slots
        });
      }
    } else if (count < currentReceipts.length) {
      // Remove excess
      currentReceipts.splice(count);
    }
    
    onChange(currentReceipts);
  };

  const updateReceipt = (index, field, value) => {
    const updated = [...receipts];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const updateImage = (receiptIndex, imageIndex, url) => {
    const updated = [...receipts];
    const newImages = [...updated[receiptIndex].images];
    newImages[imageIndex] = url;
    updated[receiptIndex] = { ...updated[receiptIndex], images: newImages };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Header & Count Selector */}
      <div className="flex items-center justify-between bg-stone-50 p-3 rounded-xl border border-stone-200">
        <h3 className="text-sm font-bold text-stone-700 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          إيصالات الأمانة
        </h3>
        
        <div className="flex items-center gap-2">
          <Label className="text-xs text-stone-500 font-medium">عدد الإيصالات:</Label>
          <select 
            className="h-8 w-16 text-center text-xs font-bold border border-stone-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-100 outline-none"
            value={receipts.length}
            onChange={handleCountChange}
          >
            {[...Array(11)].map((_, i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Receipts Grid */}
      <div className="grid grid-cols-1 gap-4">
        {receipts.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-stone-100 rounded-xl bg-white">
            <p className="text-xs text-stone-400">حدد عدد الإيصالات المطلوبة من القائمة أعلاه</p>
          </div>
        )}

        {receipts.map((receipt, idx) => (
          <div key={idx} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow relative group">
            {/* Badge */}
            <div className="absolute top-4 left-4">
               <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100">
                 {idx + 1}
               </span>
            </div>

            <div className="space-y-4">
              {/* Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-8">
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-stone-500">اسم الإيصال / صاحب التوقيع <span className="text-red-500">*</span></Label>
                  <input 
                    type="text" 
                    value={receipt.name}
                    onChange={(e) => updateReceipt(idx, 'name', e.target.value)}
                    className={cn(
                      "w-full h-9 px-3 text-xs border rounded-lg focus:ring-2 focus:ring-blue-50 outline-none transition-all",
                      !receipt.name ? "border-red-200 focus:border-red-400" : "border-stone-200 focus:border-blue-400"
                    )}
                    placeholder="الاسم الثلاثي..."
                  />
                  {!receipt.name && (
                    <p className="text-[9px] text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      مطلوب
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] text-stone-500">مبلغ الإيصال (اختياري)</Label>
                  <input 
                    type="number" 
                    value={receipt.amount}
                    onChange={(e) => updateReceipt(idx, 'amount', e.target.value)}
                    className="w-full h-9 px-3 text-xs border border-stone-200 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-50 outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Images */}
              <div>
                <Label className="text-[10px] text-stone-500 mb-2 block">صور الإيصال (الوجه، الظهر، أخرى)</Label>
                <div className="grid grid-cols-3 gap-2">
                  {receipt.images.map((imgUrl, imgIdx) => (
                    <ImageUploader 
                      key={imgIdx}
                      url={imgUrl}
                      label={`صورة ${imgIdx + 1}`}
                      onUpload={(url) => updateImage(idx, imgIdx, url)}
                      onRemove={() => updateImage(idx, imgIdx, '')}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReceiptGuaranteesSection;
