import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Store, User, Lock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Query Supabase for the user
      // Note: In a real production app, passwords should be hashed and we should use Supabase Auth.
      // For this specific custom table implementation as requested:
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('username', username)
        .eq('password', password) // Comparing plain text as requested for the custom table
        .maybeSingle();

      if (error) throw error;

      if (data) {
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: `مرحباً بك يا ${data.name}`,
          className: "bg-emerald-50 border-emerald-200 text-emerald-800"
        });
        onLogin(data);
      } else {
        toast({
          title: "خطأ في الدخول",
          description: "اسم المستخدم أو كلمة المرور غير صحيحة",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "خطأ في النظام",
        description: "حدث خطأ أثناء محاولة تسجيل الدخول. الرجاء المحاولة لاحقاً.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative overflow-hidden">
        {/* Abstract Shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-bl-full -z-10" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-stone-50 rounded-tr-full -z-10" />

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm space-y-8"
        >
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-stone-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-stone-200 rotate-3">
              <Store className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-stone-900 tracking-tight">تسجيل الدخول</h1>
            <p className="text-stone-500">أدخل بيانات حسابك للمتابعة</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-stone-700">اسم المستخدم</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-stone-400 group-focus-within:text-stone-800 transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pr-10 pl-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800/10 focus:border-stone-800 transition-all font-medium text-stone-800"
                    placeholder="example"
                    dir="ltr"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-stone-700">كلمة المرور</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-stone-400 group-focus-within:text-stone-800 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pr-10 pl-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800/10 focus:border-stone-800 transition-all font-medium text-stone-800"
                    placeholder="••••••"
                    dir="ltr"
                    autoComplete="current-password"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-6 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                   دخول للنظام
                   <ArrowLeft className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="pt-6 border-t border-stone-100 text-center">
            <p className="text-xs text-stone-400">
              للإدارة والدعم الفني، يرجى التواصل مع المسؤول
            </p>
          </div>
        </motion.div>
      </div>

      {/* Left Side - Image/Brand */}
      <div className="hidden lg:flex w-1/2 bg-stone-900 relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900/90" />
        
        <div className="relative z-10 max-w-md text-white space-y-6">
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2, duration: 0.6 }}
          >
            <h2 className="text-5xl font-bold leading-tight mb-4">
              نظام إدارة <br/>
              <span className="text-orange-400">التاجر الذكي</span>
            </h2>
            <p className="text-stone-300 text-lg leading-relaxed font-light">
              قم بإدارة عملياتك التجارية، حساباتك، وفريق العمل بكل سهولة وموثوقية في مكان واحد.
            </p>
          </motion.div>
          
          <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.6 }}
             className="flex gap-4 pt-8"
          >
             <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                <h3 className="text-2xl font-bold text-white mb-1">100%</h3>
                <p className="text-stone-400 text-xs">حماية وأمان</p>
             </div>
             <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                <h3 className="text-2xl font-bold text-white mb-1">24/7</h3>
                <p className="text-stone-400 text-xs">وصول دائم</p>
             </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;