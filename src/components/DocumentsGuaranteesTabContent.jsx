import React from 'react';
import { FileCheck, FileText, UploadCloud, ShieldCheck, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DocumentsGuaranteesTabContent = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center max-w-lg mx-auto">
       <div className="relative mb-6 group cursor-pointer">
          <div className="w-24 h-24 bg-emerald-50 rounded-3xl flex items-center justify-center transition-all group-hover:bg-emerald-100 group-hover:scale-105">
             <FileCheck className="w-10 h-10 text-emerald-300 group-hover:text-emerald-500 transition-colors" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-lg">
             <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
       </div>
       
       <h3 className="text-xl font-bold text-slate-800 mb-3">الأوراق والضمانات</h3>
       <p className="text-sm text-slate-500 leading-relaxed mb-8 max-w-sm mx-auto">
          لا توجد مستندات أو صكوك ضمان مرفقة (شيكات، عقود، إيصالات أمانة). قم برفع المستندات للحفظ والأرشفة.
       </p>

       <div className="flex gap-4">
          <Button variant="outline" className="gap-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 h-12 rounded-xl px-6">
             <UploadCloud className="w-4 h-4" />
             رفع مستند
          </Button>
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 h-12 rounded-xl px-6">
             <Plus className="w-4 h-4" />
             إضافة ضمان مالي
          </Button>
       </div>
    </div>
  );
};

export default DocumentsGuaranteesTabContent;