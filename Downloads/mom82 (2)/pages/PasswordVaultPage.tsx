
import React, { useState, useEffect, useCallback } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { DataService } from '../services/dataService';
import { PasswordCategory, VaultPassword } from '../types';
import { AuthService } from '../services/authService';

const PasswordVaultPage: React.FC = () => {
  const [categories, setCategories] = useState<PasswordCategory[]>([]);
  const [passwords, setPasswords] = useState<VaultPassword[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, 'view' | 'edit'>>({});

  // Form states
  const [showPassForm, setShowPassForm] = useState(false);
  const [editingPass, setEditingPass] = useState<Partial<VaultPassword> | null>(null);
  const [showCatForm, setShowCatForm] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', icon: '🔐', color: 'indigo' });

  // Toggle Visibility
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const session = await AuthService.getCurrentSession();
      setIsAdmin(!!session?.isAdmin);
      setPermissions(session?.vaultPermissions || {});

      const cats = await DataService.getPasswordCategories();
      
      // Filter visible categories for employees
      const filteredCats = !!session?.isAdmin 
        ? cats 
        : cats.filter(c => session?.vaultPermissions?.[c.id]);

      setCategories(filteredCats);
      
      if (filteredCats.length > 0) {
          const initialCatId = filteredCats[0].id;
          setActiveCategoryId(initialCatId);
          const passes = await DataService.getPasswordsByCategory(initialCatId);
          setPasswords(passes);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCategoryChange = async (id: string) => {
    setActiveCategoryId(id);
    setLoading(true);
    try {
        const passes = await DataService.getPasswordsByCategory(id);
        setPasswords(passes);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const togglePassVisibility = (id: string) => {
      setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, label: string) => {
      navigator.clipboard.writeText(text);
      alert(`تم نسخ ${label} إلى الحافظة`);
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPass?.title || !activeCategoryId) return;

    try {
        await DataService.upsertPassword({ ...editingPass, category_id: activeCategoryId });
        setShowPassForm(false);
        setEditingPass(null);
        handleCategoryChange(activeCategoryId);
    } catch (e: any) { alert(e.message); }
  };

  const handleAddCategory = async () => {
      if (!newCat.name) return;
      await DataService.createPasswordCategory(newCat.name, newCat.icon, newCat.color);
      setShowCatForm(false);
      setNewCat({ name: '', icon: '🔐', color: 'indigo' });
      fetchData();
  };

  const handleDeletePass = async (id: string) => {
      if (!window.confirm("حذف هذا الحساب؟")) return;
      await DataService.deletePassword(id);
      if (activeCategoryId) handleCategoryChange(activeCategoryId);
  };

  const canEdit = isAdmin || (activeCategoryId && permissions[activeCategoryId] === 'edit');

  if (loading && categories.length === 0) return <LoadingSpinner />;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-3xl font-black text-ui-lightText dark:text-ui-darkText">🔐 خزنة الحسابات (Vault)</h2>
           <p className="text-sm text-gray-500 mt-1">إدارة كلمات المرور والمفاتيح السرية بأمان</p>
        </div>
        <div className="flex gap-2">
            {isAdmin && (
                <Button onClick={() => setShowCatForm(true)} variant="secondary" size="sm">+ فئة جديدة</Button>
            )}
            {canEdit && activeCategoryId && (
                <Button onClick={() => { setEditingPass({ title: '', username: '', password: '', url: '', notes: '' }); setShowPassForm(true); }} size="sm">
                   + إضافة حساب
                </Button>
            )}
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Categories */}
        <div className="lg:col-span-1 space-y-2">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-4 mb-3">الفئات المتاحة</h3>
            {categories.map(cat => (
                <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all font-bold text-sm
                        ${activeCategoryId === cat.id 
                            ? 'bg-indigo-600 text-white shadow-lg' 
                            : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-white/10'
                        }
                    `}
                >
                    <span className="text-xl">{cat.icon}</span>
                    <span className="flex-1 text-right">{cat.name}</span>
                    {activeCategoryId === cat.id && <span className="text-xs">●</span>}
                </button>
            ))}
            {categories.length === 0 && <p className="text-xs text-gray-500 p-4">لا توجد فئات متاحة لك حالياً.</p>}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
            {activeCategoryId ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {passwords.map(pass => (
                        <Card key={pass.id} className="relative group overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all">
                             <div className="absolute top-0 right-0 left-0 h-1.5 bg-indigo-500 opacity-20"></div>
                             
                             <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="font-black text-lg text-gray-800 dark:text-white">{pass.title}</h4>
                                    {pass.url && <a href={pass.url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline">{pass.url}</a>}
                                </div>
                                <div className="flex gap-1">
                                    {canEdit && (
                                        <>
                                            <button onClick={() => { setEditingPass(pass); setShowPassForm(true); }} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors text-xs" title="تعديل">✏️</button>
                                            {isAdmin && <button onClick={() => handleDeletePass(pass.id)} className="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors text-xs" title="حذف">🗑️</button>}
                                        </>
                                    )}
                                </div>
                             </div>

                             <div className="space-y-3">
                                <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-xl flex justify-between items-center group/row">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase">اسم المستخدم</span>
                                        <span className="text-sm font-bold truncate max-w-[150px]">{pass.username || '---'}</span>
                                    </div>
                                    <button onClick={() => copyToClipboard(pass.username || '', 'اسم المستخدم')} className="text-[10px] bg-white dark:bg-slate-800 px-2 py-1 rounded shadow-sm opacity-0 group-hover/row:opacity-100 transition-opacity">نسخ</button>
                                </div>

                                <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-xl flex justify-between items-center group/row">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase">كلمة المرور</span>
                                        <span className="text-sm font-mono font-bold">
                                            {visiblePasswords[pass.id] ? pass.password : '••••••••••••'}
                                        </span>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                        <button onClick={() => togglePassVisibility(pass.id)} className="text-[10px] bg-white dark:bg-slate-800 px-2 py-1 rounded shadow-sm">{visiblePasswords[pass.id] ? 'إخفاء' : 'إظهار'}</button>
                                        <button onClick={() => copyToClipboard(pass.password || '', 'كلمة المرور')} className="text-[10px] bg-white dark:bg-slate-800 px-2 py-1 rounded shadow-sm">نسخ</button>
                                    </div>
                                </div>
                                
                                {pass.notes && (
                                    <div className="pt-2 border-t dark:border-white/5">
                                        <p className="text-[10px] text-gray-400 italic">ملاحظات: {pass.notes}</p>
                                    </div>
                                )}
                             </div>
                        </Card>
                    ))}
                    {passwords.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-white dark:bg-white/5 rounded-3xl border border-dashed">
                            <span className="text-4xl mb-4 block">📂</span>
                            <p className="text-gray-500 font-bold">لا توجد حسابات مسجلة في هذه الفئة بعد.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <span className="text-6xl mb-4">🔐</span>
                    <p>يرجى اختيار فئة من القائمة الجانبية للعرض.</p>
                </div>
            )}
        </div>
      </div>

      {/* Password Upsert Modal */}
      {showPassForm && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <Card className="w-full max-w-lg p-8 rounded-[32px] shadow-2xl border-none">
                  <h3 className="text-2xl font-black mb-6 text-indigo-600">تسجيل حساب جديد</h3>
                  <form onSubmit={handleSavePassword} className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">عنوان الحساب / الخدمة</label>
                          <input className="w-full p-4 bg-gray-50 dark:bg-black/20 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={editingPass?.title || ''} onChange={e => setEditingPass({...editingPass, title: e.target.value})} placeholder="مثال: Google Ads (ieatd)" required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">اسم المستخدم / الإيميل</label>
                            <input className="w-full p-4 bg-gray-50 dark:bg-black/20 rounded-xl outline-none" value={editingPass?.username || ''} onChange={e => setEditingPass({...editingPass, username: e.target.value})} placeholder="example@..." />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">كلمة المرور</label>
                            <input className="w-full p-4 bg-gray-50 dark:bg-black/20 rounded-xl outline-none" value={editingPass?.password || ''} onChange={e => setEditingPass({...editingPass, password: e.target.value})} required />
                        </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">رابط الموقع (URL)</label>
                          <input className="w-full p-4 bg-gray-50 dark:bg-black/20 rounded-xl outline-none" value={editingPass?.url || ''} onChange={e => setEditingPass({...editingPass, url: e.target.value})} placeholder="https://..." />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">ملاحظات إضافية</label>
                          <textarea className="w-full p-4 bg-gray-50 dark:bg-black/20 rounded-xl outline-none" value={editingPass?.notes || ''} onChange={e => setEditingPass({...editingPass, notes: e.target.value})} rows={2} />
                      </div>
                      <div className="flex gap-2 pt-4">
                          <Button type="submit" className="flex-1">حفظ البيانات</Button>
                          <Button type="button" variant="secondary" onClick={() => setShowPassForm(false)} className="flex-1">إلغاء</Button>
                      </div>
                  </form>
              </Card>
          </div>
      )}

      {/* Category Create Modal */}
      {showCatForm && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <Card className="w-full max-w-sm p-8 rounded-[32px] shadow-2xl">
                  <h3 className="text-xl font-bold mb-6">إضافة فئة حسابات جديدة</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">اسم الفئة</label>
                          <input className="w-full p-3 bg-gray-50 dark:bg-black/20 rounded-xl outline-none" value={newCat.name} onChange={e => setNewCat({...newCat, name: e.target.value})} placeholder="مثال: حسابات البنوك" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">أيقونة (Emoji)</label>
                          <input className="w-full p-3 bg-gray-50 dark:bg-black/20 rounded-xl outline-none text-center text-2xl" value={newCat.icon} onChange={e => setNewCat({...newCat, icon: e.target.value})} />
                      </div>
                      <div className="flex gap-2 pt-4">
                          <Button onClick={handleAddCategory} className="flex-1">إنشاء</Button>
                          <Button onClick={() => setShowCatForm(false)} variant="secondary" className="flex-1">إلغاء</Button>
                      </div>
                  </div>
              </Card>
          </div>
      )}
    </div>
  );
};

export default PasswordVaultPage;
