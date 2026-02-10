
import React, { useState } from 'react';
import { FileImage, UserSquare2, CreditCard } from 'lucide-react';
import ImagePreviewModal from './ImagePreviewModal';

const DocumentsTabContent = ({ finance }) => {
  const [previewImage, setPreviewImage] = useState(null);
  
  if (!finance?.accounts) return null;
  
  const account = finance.accounts;
  
  const documents = [
    {
      id: 'id_front',
      title: 'البطاقة الشخصية (وجه)',
      url: account.id_card_front,
      icon: CreditCard,
      description: 'صورة الوجه الأمامي للبطاقة'
    },
    {
      id: 'id_back',
      title: 'البطاقة الشخصية (ظهر)',
      url: account.id_card_back,
      icon: CreditCard,
      description: 'صورة الوجه الخلفي للبطاقة'
    },
    {
      id: 'personal_photo',
      title: 'الصورة الشخصية',
      url: account.id_card_image,
      icon: UserSquare2,
      description: 'الصورة الشخصية للعميل'
    }
  ].filter(doc => doc.url); // Only show existing documents

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      <div className="flex items-center gap-2 mb-4 px-1">
         <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
            <FileImage className="w-5 h-5" />
         </div>
         <h3 className="font-bold text-stone-800">مستندات العميل</h3>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-12 bg-stone-50 rounded-xl border border-dashed border-stone-200">
          <FileImage className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500 font-medium">لا توجد مستندات مرفقة لهذا العميل</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
           {documents.map((doc) => (
             <div 
               key={doc.id}
               className="group bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer"
               onClick={() => setPreviewImage({ url: doc.url, title: doc.title })}
             >
                {/* Image Preview */}
                <div className="aspect-[16/10] bg-stone-50 relative overflow-hidden">
                   <img 
                     src={doc.url} 
                     alt={doc.title}
                     className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                   />
                   <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="bg-white/90 text-stone-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                         عرض الصورة
                      </span>
                   </div>
                </div>

                {/* Info */}
                <div className="p-4">
                   <div className="flex items-start gap-3">
                      <div className="mt-1 p-1.5 bg-stone-100 rounded-md text-stone-500">
                         <doc.icon className="w-4 h-4" />
                      </div>
                      <div>
                         <h4 className="font-bold text-stone-800 text-sm">{doc.title}</h4>
                         <p className="text-xs text-stone-400 mt-0.5">{doc.description}</p>
                      </div>
                   </div>
                </div>
             </div>
           ))}
        </div>
      )}

      <ImagePreviewModal 
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage?.url}
        title={previewImage?.title}
      />
    </div>
  );
};

export default DocumentsTabContent;
