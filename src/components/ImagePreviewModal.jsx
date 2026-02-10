
import React from 'react';
import { X, Download, ZoomIn } from 'lucide-react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const ImagePreviewModal = ({ isOpen, onClose, imageUrl, title }) => {
  if (!isOpen || !imageUrl) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = title || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 bg-black/95 border-stone-800 overflow-hidden">
        <div className="relative h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 z-10 bg-gradient-to-b from-black/80 to-transparent absolute top-0 w-full">
             <h3 className="text-white font-bold text-lg drop-shadow-md">{title}</h3>
             <div className="flex items-center gap-2">
                <Button 
                   size="icon" 
                   variant="ghost" 
                   onClick={handleDownload}
                   className="text-white hover:bg-white/20 rounded-full"
                >
                   <Download className="w-5 h-5" />
                </Button>
                <DialogClose asChild>
                  <Button 
                     size="icon" 
                     variant="ghost" 
                     onClick={onClose}
                     className="text-white hover:bg-white/20 rounded-full"
                  >
                     <X className="w-6 h-6" />
                  </Button>
                </DialogClose>
             </div>
          </div>

          {/* Image Container */}
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
             <img 
               src={imageUrl} 
               alt={title} 
               className="max-h-full max-w-full object-contain rounded-md shadow-2xl"
             />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImagePreviewModal;
