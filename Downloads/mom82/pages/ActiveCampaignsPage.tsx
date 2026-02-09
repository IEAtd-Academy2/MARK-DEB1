
import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { DataService } from '../services/dataService';
import { AuthService } from '../services/authService';
import { AdCampaign } from '../types';

const ActiveCampaignsPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false); // Only Admin can edit

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
      name: '',
      destination_number: '',
      link: '',
      targeting: '',
      is_active: true
  });

  const fetchCampaigns = async () => {
      setLoading(true);
      try {
          const data = await DataService.getAdCampaigns();
          setCampaigns(data);
      } catch(e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      const init = async () => {
          const session = await AuthService.getCurrentSession();
          setIsAdmin(!!session?.isAdmin); // Only true for main admin
          fetchCampaigns();
      };
      init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.name) return;

      try {
          if (editingId) {
              await DataService.updateAdCampaign({ id: editingId, ...formData });
          } else {
              await DataService.addAdCampaign(formData);
          }
          setIsFormOpen(false);
          setEditingId(null);
          setFormData({ name: '', destination_number: '', link: '', targeting: '', is_active: true });
          fetchCampaigns();
      } catch(e: any) {
          alert('Error: ' + e.message);
      }
  };

  const handleEdit = (c: AdCampaign) => {
      setFormData({
          name: c.name,
          destination_number: c.destination_number,
          link: c.link,
          targeting: c.targeting,
          is_active: c.is_active
      });
      setEditingId(c.id);
      setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
      if(!window.confirm("حذف الحملة؟")) return;
      await DataService.deleteAdCampaign(id);
      fetchCampaigns();
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-gray-800 dark:text-white">🚀 الحملات الإعلانية النشطة</h2>
            <p className="text-gray-500 text-sm">متابعة تفاصيل الاستهداف والروابط</p>
          </div>
          {isAdmin && (
              <Button onClick={() => { setEditingId(null); setFormData({ name: '', destination_number: '', link: '', targeting: '', is_active: true }); setIsFormOpen(true); }}>
                  + إضافة حملة
              </Button>
          )}
      </div>

      {isFormOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-lg">
                  <h3 className="text-xl font-bold mb-4">{editingId ? 'تعديل حملة' : 'إضافة حملة جديدة'}</h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                          <label className="block text-sm font-bold mb-1">اسم الحملة</label>
                          <input className="w-full p-2 border rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                      </div>
                      <div>
                          <label className="block text-sm font-bold mb-1">رقم الوجهة (WhatsApp/Call)</label>
                          <input className="w-full p-2 border rounded" value={formData.destination_number} onChange={e => setFormData({...formData, destination_number: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-sm font-bold mb-1">رابط الإعلان/البوست</label>
                          <input className="w-full p-2 border rounded ltr" dir="ltr" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-sm font-bold mb-1">تفاصيل الاستهداف</label>
                          <textarea className="w-full p-2 border rounded" rows={3} value={formData.targeting} onChange={e => setFormData({...formData, targeting: e.target.value})} placeholder="السن، المنطقة، الاهتمامات..." />
                      </div>
                      <div className="flex items-center gap-2">
                          <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                          <label className="font-bold text-sm">حالة نشطة</label>
                      </div>
                      <div className="flex gap-2 pt-4">
                          <Button type="submit" className="flex-1">حفظ</Button>
                          <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsFormOpen(false)}>إلغاء</Button>
                      </div>
                  </form>
              </Card>
          </div>
      )}

      {loading ? <LoadingSpinner /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map(c => (
                  <div key={c.id} className={`bg-white dark:bg-white/5 border rounded-2xl p-6 shadow-sm relative overflow-hidden transition-all hover:shadow-md ${c.is_active ? 'border-green-200' : 'border-gray-200 opacity-70'}`}>
                      {c.is_active && <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] px-3 py-1 rounded-bl-xl font-bold">نشطة</div>}
                      
                      <h3 className="font-black text-lg mb-4 text-gray-800 dark:text-white truncate">{c.name}</h3>
                      
                      <div className="space-y-3 text-sm">
                          <div className="flex items-center gap-2">
                              <span className="text-gray-400 text-xs uppercase font-bold w-16">الوجهة:</span>
                              <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 rounded" dir="ltr">{c.destination_number || '-'}</span>
                          </div>
                          <div className="flex items-start gap-2">
                              <span className="text-gray-400 text-xs uppercase font-bold w-16 mt-1">الرابط:</span>
                              <a href={c.link} target="_blank" rel="noreferrer" className="text-blue-500 underline truncate flex-1 block hover:text-blue-700">{c.link || 'لا يوجد رابط'}</a>
                          </div>
                          <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-lg border border-dashed border-gray-200 mt-2">
                              <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">الاستهداف:</p>
                              <p className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed">{c.targeting || 'غير محدد'}</p>
                          </div>
                      </div>

                      {isAdmin && (
                          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                              <button onClick={() => handleEdit(c)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold py-2 rounded">تعديل</button>
                              <button onClick={() => handleDelete(c.id)} className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold py-2 rounded">حذف</button>
                          </div>
                      )}
                  </div>
              ))}
              {campaigns.length === 0 && <p className="text-gray-500 col-span-full text-center py-10">لا توجد حملات مسجلة.</p>}
          </div>
      )}
    </div>
  );
};

export default ActiveCampaignsPage;
