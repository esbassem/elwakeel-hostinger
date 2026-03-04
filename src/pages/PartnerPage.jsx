import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePartners } from '@/hooks/usePartners';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ArrowRight, Save, AlertCircle, Upload, Check, X, Pencil, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const PartnerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPartnerById, updatePartner, addPartner, uploadIdCardImage, loading } = usePartners();
  const [partner, setPartner] = useState(null);
  const [isEditing, setIsEditing] = useState(!id);
  const [missingFields, setMissingFields] = useState([]);
  const [isNew, setIsNew] = useState(!id);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      const fetchPartner = async () => {
        const { data } = await getPartnerById(id);
        if (data) {
          setPartner(data);
          setImagePreview(data.id_card_image);
        }
      };
      fetchPartner();
    } else {
      setPartner({
        name: '',
        nickname: '',
        phone1: '',
        phone2: '',
        address: '',
        national_id: '',
        account_type: 'customer',
        notes: '',
        id_card_image: null
      });
    }
  }, [id, getPartnerById]);

  const checkMissingFields = (currentPartner) => {
    const required = ['name', 'phone1', 'account_type'];
    const missing = required.filter(field => !currentPartner[field]);
    setMissingFields(missing);
  };
  
  useEffect(() => {
    if (partner) {
      checkMissingFields(partner);
    }
  }, [partner]);


  const handleInputChange = (field, value) => {
    setPartner(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    let imageUrl = partner.id_card_image;

    if (imageFile) {
      const { url } = await uploadIdCardImage(imageFile, id || Date.now());
      if (url) {
        imageUrl = url;
      }
    }
    
    const partnerData = { ...partner, id_card_image: imageUrl };

    if (isNew) {
      const { data: newPartner, error } = await addPartner(partnerData);
      if (newPartner) {
        navigate(`/partners/${newPartner.id}`);
        setIsEditing(false);
        setIsNew(false);
      }
    } else {
      const { data: updatedPartner, error } = await updatePartner(id, partnerData);
      if (updatedPartner) {
        setPartner(updatedPartner);
        setIsEditing(false);
      }
    }
  };
  
  const handleDelete = async () => {
      // Implement soft delete logic if needed
      toast({ title: "Note", description: "Delete functionality is not fully implemented yet." });
      setIsConfirmingDelete(false);
  };

  if (loading && !partner) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 font-cairo" dir='rtl'>
      <div className="flex justify-between items-center mb-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowRight className="ml-2 h-4 w-4" />
          عودة
        </Button>
        <h1 className="text-2xl font-bold">{isNew ? 'شريك جديد' : 'تعديل بيانات الشريك'}</h1>
        {id && (
          <div>
            <Button variant="outline" size="icon" className="ml-2" onClick={() => setIsEditing(!isEditing)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="icon" onClick={() => setIsConfirmingDelete(true)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {missingFields.length > 0 && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
          <p className="font-bold flex items-center"><AlertCircle className='w-4 h-4 ml-2'/> بيانات ناقصة</p>
          <p>بعض الحقول المطلوبة فارغة: {missingFields.join(', ')}</p>
        </div>
      )}

      {partner && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-full bg-gray-200 mb-4 flex items-center justify-center overflow-hidden">
                  {imagePreview ? <img src={imagePreview} alt="ID Card" className='w-full h-full object-cover' /> : <Upload className="h-12 w-12 text-gray-400" />}
                </div>
                {isEditing && (
                  <div className='w-full'>
                    <Input id="image-upload" type="file" onChange={handleImageChange} className='mb-2'/>
                    <Label htmlFor="image-upload" className='text-xs text-center block text-gray-500'>رفع صورة البطاقة الشخصية</Label>
                  </div>
                )}
                <h2 className="text-xl font-bold mt-4">{partner.name || 'اسم الشريك'}</h2>
                <p className="text-sm text-gray-500">{partner.nickname}</p>
              </div>
            </div>
          </div>
          <div className="md:col-span-2 bg-white p-6 rounded-lg shadow">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">الاسم الكامل</Label>
                <Input id="name" value={partner.name} onChange={(e) => handleInputChange('name', e.target.value)} readOnly={!isEditing} />
              </div>
              <div>
                <Label htmlFor="nickname">اللقب/اسم الشهرة</Label>
                <Input id="nickname" value={partner.nickname} onChange={(e) => handleInputChange('nickname', e.target.value)} readOnly={!isEditing} />
              </div>
              <div>
                <Label htmlFor="phone1">رقم الهاتف 1</Label>
                <Input id="phone1" value={partner.phone1} onChange={(e) => handleInputChange('phone1', e.target.value)} readOnly={!isEditing} />
              </div>
              <div>
                <Label htmlFor="phone2">رقم الهاتف 2</Label>
                <Input id="phone2" value={partner.phone2} onChange={(e) => handleInputChange('phone2', e.target.value)} readOnly={!isEditing} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="address">العنوان</Label>
                <Input id="address" value={partner.address} onChange={(e) => handleInputChange('address', e.target.value)} readOnly={!isEditing} />
              </div>
              <div>
                <Label htmlFor="national_id">الرقم القومي</Label>
                <Input id="national_id" value={partner.national_id} onChange={(e) => handleInputChange('national_id', e.target.value)} readOnly={!isEditing} />
              </div>
              <div>
                <Label htmlFor="account_type">نوع الحساب</Label>
                <Select value={partner.account_type} onValueChange={(value) => handleInputChange('account_type', value)} disabled={!isEditing}>
                  <SelectTrigger id="account_type">
                    <SelectValue placeholder="اختر نوع الحساب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">عميل</SelectItem>
                    <SelectItem value="supplier">مورد</SelectItem>
                    <SelectItem value="investor">مستثمر</SelectItem>
                    <SelectItem value="employee">موظف</SelectItem>
                    <SelectItem value="other">آخر</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <Input id="notes" value={partner.notes} onChange={(e) => handleInputChange('notes', e.target.value)} readOnly={!isEditing} />
              </div>
            </div>
            {isEditing && (
              <div className="flex justify-end mt-6">
                <Button onClick={handleSave} disabled={loading}>
                  <Save className="ml-2 h-4 w-4" />
                  حفظ التغييرات
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <Dialog open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
          </DialogHeader>
          <p>هل أنت متأكد أنك تريد حذف هذا الشريك؟ لا يمكن التراجع عن هذا الإجراء.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsConfirmingDelete(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleDelete}>حذف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PartnerPage;
