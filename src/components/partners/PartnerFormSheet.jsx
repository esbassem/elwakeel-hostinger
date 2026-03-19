import { useState, useEffect, useRef } from 'react';
import {
  Sheet,
  SheetContent,
} from '../ui/sheet';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { usePartners } from '../../hooks/usePartners';
import { Camera, CheckCircle2 } from 'lucide-react';

// --- Simple Input ---
const SimpleInput = ({ label, id, required, className = '', ...props }) => (
  <div className="space-y-1.5">
    <Label htmlFor={id} className="font-semibold px-1 text-slate-800">
      {label} {required && <span className="text-red-500">*</span>}
    </Label>
    <Input
      id={id}
      name={id}
      required={required}
      {...props}
      className={`h-12 bg-slate-100 border-slate-200 shadow-sm text-base ${className}`}
    />
  </div>
);

// --- File Upload ---
const StyledFileUpload = ({ id, label, onFileChange, previewUrl, currentImageUrl }) => {
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [localPreview, setLocalPreview] = useState('');

  const displayUrl = localPreview || previewUrl || currentImageUrl;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      setLocalPreview(URL.createObjectURL(file));
      onFileChange(file);
    }
  };

  useEffect(() => {
    return () => {
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

  return (
    <div className="space-y-1.5">
      <Label className="font-semibold px-1 text-slate-800">{label}</Label>

      <div
        className="group flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-500 transition-all bg-slate-50 h-32 cursor-pointer relative overflow-hidden"
        onClick={() => inputRef.current?.click()}
      >
        <input
          type="file"
          id={id}
          name={id}
          ref={inputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />

        {fileName || displayUrl ? (
          <div className="text-center p-2 relative w-full h-full">
            {displayUrl && (
              <img
                src={displayUrl}
                alt="Preview"
                className="max-w-full max-h-full object-contain rounded-md absolute inset-0 w-full h-full p-1"
              />
            )}

            {fileName && (
              <div className="absolute top-2 left-2 bg-white/85 rounded-full p-1 shadow">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            )}

            <p className="text-sm font-bold text-slate-700 break-words max-w-full bg-white/75 backdrop-blur-sm rounded-md px-2 py-1 absolute bottom-2 left-1/2 -translate-x-1/2 w-[90%]">
              {fileName || 'ملف موجود'}
            </p>
          </div>
        ) : (
          <div className="text-center text-slate-500 group-hover:text-blue-600 transition-colors">
            <Camera className="w-8 h-8 mx-auto mb-2" />
            <p className="font-semibold">{label}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const PartnerFormSheet = ({
  open,
  onClose,
  mode = 'create',
  partner,
  defaultType,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({});
  const { addPartner, updatePartner, loading } = usePartners();

  useEffect(() => {
    if (!open) return;

    if (mode === 'edit' && partner) {
      setFormData({
        ...partner,
        id_card_front: null,
        id_card_back: null,
      });
    } else {
      setFormData({
        name: '',
        nickname: '',
        phone1: '',
        phone2: '',
        address: '',
        account_type: defaultType || 'customer',
        id_card_front: null,
        id_card_back: null,
      });
    }
  }, [partner, mode, open, defaultType]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleImageChange = (id, file) => {
    setFormData((prev) => ({
      ...prev,
      [id]: file,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let savedPartner = null;

    if (mode === 'create') {
      savedPartner = await addPartner(formData);
    } else {
      const { id, ...updateData } = formData;
      savedPartner = await updatePartner(partner.id, updateData);
    }

    if (savedPartner) {
      onSuccess?.(savedPartner);
      onClose?.();
    }
  };

  const title = mode === 'create' ? 'إضافة شريك جديد' : 'تعديل بيانات الشريك';

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose?.()} modal={false}>
      <SheetContent
        hideCloseButton
        side="bottom"
        className="z-[80] h-auto max-h-[90vh] flex flex-col rounded-t-2xl border-t p-0 bg-white"
      >
        <header
          dir="rtl"
          className="flex-shrink-0 p-3 bg-white border-b flex items-center justify-between"
        >
          <h2 className="text-lg font-bold px-2">{title}</h2>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            إلغاء
          </Button>
        </header>

        <ScrollArea className="flex-grow">
          <form
            id="partner-form"
            onSubmit={handleSubmit}
            dir="rtl"
            className="p-4 space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <SimpleInput
                label="الاسم"
                id="name"
                value={formData.name || ''}
                onChange={handleChange}
                required
              />

              <SimpleInput
                label="اللقب"
                id="nickname"
                value={formData.nickname || ''}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <SimpleInput
                label="الهاتف 1"
                id="phone1"
                value={formData.phone1 || ''}
                onChange={handleChange}
                dir="ltr"
              />

              <SimpleInput
                label="الهاتف 2"
                id="phone2"
                value={formData.phone2 || ''}
                onChange={handleChange}
                dir="ltr"
              />
            </div>

            <SimpleInput
              label="العنوان"
              id="address"
              value={formData.address || ''}
              onChange={handleChange}
            />

            <div className="grid grid-cols-2 gap-4 pt-4">
              <StyledFileUpload
                id="id_card_front"
                label="صورة البطاقة (وجه)"
                currentImageUrl={partner?.id_card_front}
                onFileChange={(file) => handleImageChange('id_card_front', file)}
              />

              <StyledFileUpload
                id="id_card_back"
                label="صورة البطاقة (ظهر)"
                currentImageUrl={partner?.id_card_back}
                onFileChange={(file) => handleImageChange('id_card_back', file)}
              />
            </div>
          </form>
        </ScrollArea>

        <footer dir="rtl" className="p-3 bg-white/80 backdrop-blur-sm border-t">
          <Button
            type="submit"
            form="partner-form"
            disabled={loading}
            className="w-full h-12 text-base font-bold"
          >
            {loading ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </footer>
      </SheetContent>
    </Sheet>
  );
};

export default PartnerFormSheet;