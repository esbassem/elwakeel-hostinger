
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import ReceiptGuaranteesSection from './ReceiptGuaranteesSection';

// Helper for image upload
const FileUpload = ({ value, onChange, label }) => {
  const [uploading, setUploading] = React.useState(false);

  const handleUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error } = await supabase.storage.from('finance-attachments').upload(fileName, file);

      if (error) throw error;

      const { data } = supabase.storage.from('finance-attachments').getPublicUrl(fileName);
      onChange(data.publicUrl);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative border border-dashed border-stone-300 rounded-lg p-3 hover:bg-stone-50 transition-colors text-center cursor-pointer group bg-white h-full flex flex-col justify-center">
      <input 
        type="file" 
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
        onChange={handleUpload}
        accept="image/*"
      />
      <div className="flex flex-col items-center gap-1">
        {uploading ? (
           <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
        ) : value ? (
           <div className="relative w-full h-20">
             <img src={value} alt="Preview" className="w-full h-full object-contain rounded" />
             <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded">
                <span className="text-white text-xs font-bold">تغيير</span>
             </div>
           </div>
        ) : (
           <>
             <ImageIcon className="w-5 h-5 text-stone-400 group-hover:text-blue-500 transition-colors" />
             <span className="text-[10px] text-stone-500 font-medium group-hover:text-stone-700">{label || 'رفع صورة'}</span>
           </>
        )}
      </div>
    </div>
  );
};

const DocumentUploadSection = ({ receipts, agreements, onReceiptsChange, onAgreementsChange }) => {

  const addAgreement = () => {
    onAgreementsChange([
      ...agreements,
      {
        title: 'عقد تمويل',
        imageUrl: ''
      }
    ]);
  };

  const updateAgreement = (index, field, value) => {
    const updated = [...agreements];
    updated[index] = { ...updated[index], [field]: value };
    onAgreementsChange(updated);
  };

  const removeAgreement = (index) => {
    onAgreementsChange(agreements.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8">
      {/* Receipts Section - Replaced with new component */}
      <ReceiptGuaranteesSection receipts={receipts} onChange={onReceiptsChange} />

      {/* Agreements Section */}
      <div className="space-y-4 pt-4 border-t border-stone-100">
        <div className="flex items-center justify-between bg-purple-50 p-3 rounded-xl border border-purple-100">
          <h3 className="text-sm font-bold text-purple-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-600" />
            العقود والمستندات الإضافية
          </h3>
          <Button 
            onClick={addAgreement} 
            variant="ghost" 
            size="sm" 
            className="h-7 text-xs gap-1 text-purple-600 hover:bg-purple-100 font-bold"
          >
            <Plus className="w-3 h-3" />
            إضافة مستند
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {agreements.length === 0 && (
             <div className="text-center py-6 border-2 border-dashed border-stone-100 rounded-xl bg-white">
                <p className="text-xs text-stone-400">لا توجد عقود مضافة</p>
             </div>
          )}

          {agreements.map((agreement, index) => (
             <div key={index} className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm relative group flex gap-3 items-start">
                <Button 
                   variant="ghost" 
                   size="sm" 
                   onClick={() => removeAgreement(index)} 
                   className="absolute top-1 left-1 h-5 w-5 p-0 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all z-20"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
                
                <div className="flex-1 space-y-2">
                   <div className="space-y-1">
                       <Label className="text-[10px] text-stone-500">نوع المستند</Label>
                       <input 
                         type="text" 
                         value={agreement.title} 
                         onChange={(e) => updateAgreement(index, 'title', e.target.value)}
                         className="w-full h-9 px-3 text-xs border border-stone-200 rounded-lg focus:border-purple-400 outline-none transition-all"
                         placeholder="مثال: عقد بيع"
                       />
                   </div>
                </div>

                <div className="w-24 h-full">
                   <FileUpload 
                      value={agreement.imageUrl} 
                      onChange={(url) => updateAgreement(index, 'imageUrl', url)} 
                      label="صورة العقد"
                   />
                </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadSection;
