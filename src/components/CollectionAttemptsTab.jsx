
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  PhoneCall, Send, History, CheckCircle2, XCircle, Clock 
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const CollectionAttemptsTab = ({ financeId, installmentNumber, currentUser }) => {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionType, setActionType] = useState('call'); // call, promise, no_answer
  const { toast } = useToast();

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('finance_notes')
        .select('*')
        .eq('finance_id', financeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  }, [financeId]);

  useEffect(() => {
    if (financeId) {
      fetchNotes();
    }
  }, [financeId, fetchNotes]);

  const handleSubmit = async () => {
    if (!newNote.trim()) return;

    setSubmitting(true);
    try {
      const prefix = `[قسط #${installmentNumber}] [${getActionLabel(actionType)}] `;
      const fullNote = prefix + newNote;

      const { error } = await supabase
        .from('finance_notes')
        .insert([{
          finance_id: financeId,
          note_text: fullNote,
          created_by: currentUser?.id, // Assuming user ID is available or use name
          user_name: currentUser?.name || 'مستخدم'
        }]);

      if (error) throw error;

      toast({
        title: "تمت الإضافة",
        description: "تم تسجيل ملاحظة التحصيل بنجاح",
        className: "bg-emerald-50 border-emerald-200"
      });
      
      setNewNote('');
      fetchNotes();

    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "خطأ",
        description: "فشل إضافة الملاحظة",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getActionLabel = (type) => {
    switch(type) {
      case 'call': return 'اتصال';
      case 'promise': return 'وعد بالدفع';
      case 'no_answer': return 'لا يوجد رد';
      default: return 'ملاحظة';
    }
  };

  const getActionIcon = (text) => {
    if (text.includes('[اتصال]')) return <PhoneCall className="w-3 h-3" />;
    if (text.includes('[وعد بالدفع]')) return <CheckCircle2 className="w-3 h-3 text-emerald-500" />;
    if (text.includes('[لا يوجد رد]')) return <XCircle className="w-3 h-3 text-red-500" />;
    return <History className="w-3 h-3" />;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 space-y-3">
        <label className="text-sm font-bold text-stone-700">تسجيل محاولة تحصيل جديدة</label>
        
        <div className="flex gap-2 mb-2">
          <ActionBadge 
            type="call" label="اتصال" active={actionType === 'call'} 
            onClick={() => setActionType('call')} icon={PhoneCall}
          />
          <ActionBadge 
            type="promise" label="وعد بالدفع" active={actionType === 'promise'} 
            onClick={() => setActionType('promise')} icon={CheckCircle2}
          />
          <ActionBadge 
            type="no_answer" label="لا يرد" active={actionType === 'no_answer'} 
            onClick={() => setActionType('no_answer')} icon={XCircle}
          />
        </div>

        <div className="relative">
          <Textarea 
            placeholder="اكتب تفاصيل المكالمة أو الملاحظة..." 
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="min-h-[80px] resize-none pr-10"
          />
          <Button 
            size="icon" 
            className="absolute bottom-2 left-2 h-8 w-8 rounded-full"
            onClick={handleSubmit}
            disabled={submitting || !newNote.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <History className="w-4 h-4 text-stone-400" />
        <h4 className="text-xs font-bold text-stone-500">سجل المحاولات والملاحظات</h4>
      </div>

      <ScrollArea className="flex-1 pr-2 -mr-2">
        {loading ? (
          <div className="space-y-3 mt-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-stone-300 text-sm">
            لا توجد ملاحظات سابقة
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {notes.map((note) => (
              <div key={note.id} className="bg-stone-50 p-3 rounded-lg border border-stone-100 text-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs text-stone-600 flex items-center gap-1">
                    {getActionIcon(note.note_text)}
                    {note.user_name}
                  </span>
                  <span className="text-[10px] text-stone-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(note.created_at).toLocaleDateString('ar-LY')}
                  </span>
                </div>
                <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">
                  {note.note_text}
                </p>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

const ActionBadge = ({ type, label, active, onClick, icon: Icon }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
      active 
        ? 'bg-stone-800 text-white shadow-md transform scale-105' 
        : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
    }`}
  >
    <Icon className="w-3 h-3" />
    {label}
  </button>
);

export default CollectionAttemptsTab;
