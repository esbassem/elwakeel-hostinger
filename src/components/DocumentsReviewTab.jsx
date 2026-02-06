
import React, { useState } from 'react';
import { FileImage, CreditCard, UserSquare2 } from 'lucide-react';
import ImagePreviewModal from './ImagePreviewModal';

const DocumentsReviewTab = ({ finance }) => {
  const [previewImage, setPreviewImage] = useState(null);

  if (!finance?.accounts) return null;

  const account = finance.accounts;

  // We prioritize Front and Back ID cards as requested.
  // We also include the Personal Photo (id_card_image) if available.
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
  ].filter(doc => doc.url);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {documents.length === 0 ? (
        <div className="text-center py-8 bg-stone-50 rounded-xl border border-dashed border-stone-200">
          <FileImage className="w-10 h-10 text-stone-300 mx-auto mb-2" />
          <p className="text-stone-500 text-sm">لا توجد مستندات مرفقة لهذا العميل</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div 
              key={doc.id}
              className="group bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-md transition-all cursor-pointer"
              onClick={() => setPreviewImage({ url: doc.url, title: doc.title })}
            >
              <div className="aspect-[16/10] bg-stone-50 relative overflow-hidden">
                <img 
                  src={doc.url} 
                  alt={doc.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="bg-white/90 text-stone-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                    معاينة
                  </span>
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-stone-100 rounded-md text-stone-500">
                    <doc.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-800 text-sm">{doc.title}</h4>
                    <p className="text-[10px] text-stone-400">{doc.description}</p>
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

export default DocumentsReviewTab;
