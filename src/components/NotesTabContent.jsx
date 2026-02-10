import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, User, Loader2, Clock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFinance } from '@/hooks/useFinance';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const NotesTabContent = ({ finance, currentUser }) => {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef(null);
  
  const { getFinanceNotes, addFinanceNote } = useFinance();

  useEffect(() => {
    if (finance?.id) {
      loadNotes();
    }
  }, [finance?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [notes]);

  const loadNotes = async () => {
    setLoading(true);
    const { data } = await getFinanceNotes(finance.id);
    if (data) setNotes(data.reverse()); // Newest at bottom
    setLoading(false);
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSubmitting(true);
    const { data } = await addFinanceNote(finance.id, newNote, currentUser || { name: 'المستخدم' });
    if (data) {
      setNotes([...notes, data]);
      setNewNote('');
    }
    setSubmitting(false);
  };

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      {/* Timeline Header */}
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
         <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg shadow-sm">
               <Clock className="w-4 h-4" />
            </div>
            <div>
               <h3 className="font-bold text-sm text-slate-800">سجل الملاحظات</h3>
               <p className="text-[10px] text-slate-400 font-medium">متابعة النشاطات</p>
            </div>
         </div>
         <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-400">
            {notes.length} ملاحظة
         </span>
      </div>

      {/* Messages Area */}
      <div 
         ref={scrollRef}
         className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8f9fc] scroll-smooth"
      >
         {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
               <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
               <p className="text-xs text-slate-400">جاري التحميل...</p>
            </div>
         ) : notes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-60">
               <MessageSquare className="w-12 h-12 mb-3 stroke-1" />
               <p className="text-sm font-bold">لا توجد ملاحظات</p>
               <p className="text-[10px]">ابدأ المحادثة بإضافة ملاحظة</p>
            </div>
         ) : (
            <div className="space-y-4">
               <div className="text-center">
                  <span className="text-[9px] font-bold text-slate-300 bg-slate-100 px-2 py-0.5 rounded-full">بداية السجل</span>
               </div>
               <AnimatePresence>
                  {notes.map((note) => {
                     const isMe = note.created_by === (currentUser?.name || currentUser?.username);
                     // In RTL: flex-row flows Right to Left. 
                     // If isMe (User), we want them on the Left side? No, standard chat usually puts 'Me' on one side. 
                     // Let's stick to standard: Me on Left (in RTL logic this might be reversed visual if not careful).
                     // Actually simplest logic: 
                     // Me -> Left Side of Screen (End of RTL line) -> mr-auto (margin right auto pushes to left)
                     // Other -> Right Side of Screen (Start of RTL line) -> ml-auto
                     
                     return (
                        <motion.div 
                           key={note.id} 
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           className={cn("flex gap-3 max-w-[85%]", isMe ? "mr-auto flex-row-reverse" : "ml-auto")}
                        >
                           <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 shadow-sm border",
                              isMe ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-100"
                           )}>
                              {note.user_name ? note.user_name.charAt(0) : <User className="w-4 h-4" />}
                           </div>
                           
                           <div className="space-y-1 flex-1">
                              <div className={cn("flex items-center gap-2 px-1", isMe ? "flex-row-reverse" : "")}>
                                 <span className="text-[11px] font-bold text-slate-700">{note.user_name || note.created_by}</span>
                                 <span className="text-[9px] text-slate-400 font-mono">
                                    {new Date(note.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute:'2-digit' })}
                                 </span>
                              </div>
                              
                              <div className={cn(
                                 "p-3 rounded-2xl text-xs leading-relaxed shadow-sm relative group",
                                 isMe 
                                    ? "bg-blue-600 text-white rounded-tr-none" 
                                    : "bg-white border border-slate-100 text-slate-700 rounded-tl-none"
                              )}>
                                 {note.note_text}
                              </div>
                           </div>
                        </motion.div>
                     );
                  })}
               </AnimatePresence>
            </div>
         )}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-slate-100">
         <form onSubmit={handleAddNote} className="flex gap-2 relative bg-slate-50 p-1.5 rounded-xl border border-slate-200 focus-within:border-blue-300 transition-all">
            <input
               type="text"
               value={newNote}
               onChange={(e) => setNewNote(e.target.value)}
               placeholder="اكتب ملاحظة..."
               className="flex-1 bg-transparent border-none px-3 py-2 text-sm focus:outline-none placeholder:text-slate-400"
            />
            {/* In RTL, button should be on the left. Flex row does R to L, so last item is on Left. */}
            <Button 
               type="submit" 
               disabled={submitting || !newNote.trim()}
               className={cn(
                  "h-9 w-9 rounded-lg transition-all p-0 shadow-sm shrink-0",
                  newNote.trim() ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-slate-200 text-slate-400"
               )}
            >
               {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 rotate-180" />}
            </Button>
         </form>
      </div>
    </div>
  );
};

export default NotesTabContent;