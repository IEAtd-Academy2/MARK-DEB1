
import React, { useState } from 'react';
import Card from '../components/common/Card';
import Alert from '../components/common/Alert';
import { AuthService } from '../services/authService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { isSupabaseConfigured } from '../supabaseClient';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await AuthService.login(email, password);
      onLoginSuccess();
    } catch (err: any) {
      console.error("Login Error Details:", err);
      // Check for specific connection errors
      if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('connection'))) {
          setError('فشل الاتصال بالخادم. يرجى التحقق من الإنترنت أو إعدادات الرابط.');
      } else if (err.message && err.message.includes('Invalid login credentials')) {
          setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      } else {
          setError('حدث خطأ أثناء تسجيل الدخول. راجع الـ Console للتفاصيل.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isSupabaseConfigured) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-ui-lightBg dark:bg-ui-darkBg p-6">
            <Card className="p-10 shadow-xl max-w-md w-full border-l-4 border-red-500">
                <h2 className="text-xl font-bold text-red-600 mb-4">⚠️ إعدادات النظام ناقصة</h2>
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                    لم يتم العثور على روابط الاتصال بقاعدة البيانات (Supabase Keys).
                </p>
                <div className="bg-gray-100 p-4 rounded text-xs font-mono text-left dir-ltr mb-4 text-red-800">
                    VITE_SUPABASE_URL<br/>
                    VITE_SUPABASE_ANON_KEY
                </div>
                <p className="text-gray-500 text-xs">
                    تأكد من إضافتها في إعدادات Netlify (Environment Variables) ثم قم بعمل 
                    <strong> Redeploy </strong> 
                    للموقع.
                </p>
            </Card>
        </div>
      );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ui-lightBg dark:bg-ui-darkBg p-6 transition-colors duration-700">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
           <h1 className="text-3xl font-black text-ui-lightText dark:text-white tracking-tight">مرحباً بك.</h1>
           <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">نظام إدارة الأكاديمية</p>
        </div>

        <Card className="p-10 shadow-xl">
          {error && <Alert type="error" message={error} className="mb-6 rounded-xl text-sm" />}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-ui-lightBg dark:bg-black/20 p-4 rounded-xl border border-ui-lightBorder dark:border-ui-darkBorder focus:border-gray-400 dark:focus:border-gray-600 outline-none transition-all text-ui-lightText dark:text-white text-sm"
                placeholder="name@ieatd.com"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">كلمة المرور</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-ui-lightBg dark:bg-black/20 p-4 rounded-xl border border-ui-lightBorder dark:border-ui-darkBorder focus:border-gray-400 dark:focus:border-gray-600 outline-none transition-all text-ui-lightText dark:text-white text-sm"
                placeholder="••••••••"
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="w-full py-4 bg-ui-lightText dark:bg-white text-white dark:text-black font-bold rounded-xl shadow-md transition-all hover:opacity-90 active:scale-95 text-sm"
              disabled={loading}
            >
              {loading ? <LoadingSpinner /> : 'تسجيل الدخول'}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;