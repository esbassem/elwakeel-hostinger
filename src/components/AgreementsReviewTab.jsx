
import React, { useState } from 'react';
import { FileText, Eye, Download, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ImagePreviewModal from './ImagePreviewModal';

const AgreementsReviewTab = ({ agreements, loading }) => {
  const [previewImage, setPreviewImage] = useState(null);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
    );
  }

  if (!agreements || agreements.length === 0) {
    return (
      <div className="text-center py-8 bg-stone-50 rounded-xl border border-dashed border-stone-200">
        <FileText className="w-10 h-10 text-stone-300 mx-auto mb-2" />
        <p className="text-stone-500 text-sm">لا توجد عقود مرفقة</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {agreements.map((agreement) => (
          <div key={agreement.id} className="bg-white rounded-xl border border-stone-100 shadow-sm overflow-hidden flex flex-col group">
            {/* Thumbnail */}
            <div 
              className="aspect-[4/3] bg-stone-50 relative cursor-pointer overflow-hidden border-b border-stone-50"
              onClick={() => setPreviewImage({ url: agreement.contract_image_url, title: agreement.contract_name })}
            >
              {agreement.contract_image_url ? (
                <>
                  <img 
                    src={agreement.contract_image_url} 
                    alt={agreement.contract_name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Eye className="w-8 h-8 text-white drop-shadow-md" />
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-300">
                  <FileText className="w-10 h-10" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-3 flex-1 flex flex-col">
              <h4 className="font-bold text-stone-800 text-xs mb-1 line-clamp-1" title={agreement.contract_name}>
                {agreement.contract_name || 'عقد تمويل'}
              </h4>
              
              <div className="flex items-center gap-1 text-[10px] text-stone-400 mb-3">
                <Calendar className="w-3 h-3" />
                <span>{new Date(agreement.created_at).toLocaleDateString('ar-LY')}</span>
              </div>

              <div className="mt-auto flex gap-2">
                <Button 
                  size="sm"
                  className="flex-1 bg-stone-900 hover:bg-stone-800 text-[10px] h-7 px-0"
                  onClick={() => setPreviewImage({ url: agreement.contract_image_url, title: agreement.contract_name })}
                  disabled={!agreement.contract_image_url}
                >
                  <Eye className="w-3 h-3 ml-1" />
                  معاينة
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  className="flex-1 border-stone-200 text-[10px] h-7 px-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    const link = document.createElement('a');
                    link.href = agreement.contract_image_url;
                    link.download = agreement.contract_name || 'contract';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  disabled={!agreement.contract_image_url}
                >
                  <Download className="w-3 h-3 ml-1" />
                  تحميل
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ImagePreviewModal 
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage?.url}
        title={previewImage?.title}
      />
    </div>
  );
};

export default AgreementsReviewTab;
