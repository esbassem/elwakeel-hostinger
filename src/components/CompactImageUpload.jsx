
import React, { useState } from 'react';
import { Loader2, Image as ImageIcon, Edit2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const CompactImageUpload = ({ label, value, onChange, bucketName = 'finance-attachments', heightClass = "h-20" }) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
      onChange(data.publicUrl);
    } catch (error) {
      console.error("Upload error:", error);
      alert('فشل رفع الصورة');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`relative group overflow-hidden border border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-blue-50/50 hover:border-blue-500 transition-all ${heightClass} w-full flex flex-col items-center justify-center cursor-pointer`}>
      <input 
        type="file" 
        accept="image/*"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        onChange={handleUpload}
        disabled={uploading}
      />
      
      {value ? (
        <>
          <img src={value} alt="Preview" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity rounded-md" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-20 backdrop-blur-[1px]">
             <Edit2 className="w-4 h-4 text-white drop-shadow-md" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold py-1 text-center truncate px-2">
             {label}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-1.5 p-2 text-center">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> : <ImageIcon className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />}
          <span className="text-[9px] font-bold text-slate-500 group-hover:text-blue-700 transition-colors">{label}</span>
        </div>
      )}
    </div>
  );
};

export default CompactImageUpload;
