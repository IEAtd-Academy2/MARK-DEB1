
import React, { useState, useEffect, useCallback } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { DataService } from '../services/dataService';
import { Campaign } from '../types';

const CampaignManagement: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [expenses, setExpenses] = useState<number | ''>('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const data = await DataService.getAllCampaigns();
      setCampaigns(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleAddCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || expenses === '') return;

    try {
      await DataService.addCampaign({
        name,
        expenses: Number(expenses),
        month,
        year
      });
      setName('');
      setExpenses('');
      fetchCampaigns();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await DataService.deleteCampaign(id);
      fetchCampaigns();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-ui-lightText dark:text-ui-darkText">إدارة الحملات الإعلانية</h2>
      
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      <Card>
        <h3 className="text-xl font-semibold mb-4 text-ui-lightText dark:text-ui-darkText">إضافة حملة جديدة</h3>
        <form onSubmit={handleAddCampaign} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-ui-lightMuted dark:text-ui-darkMuted mb-1">اسم الحملة</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-ui-lightBg dark:bg-ui-darkBg border border-ui-lightBorder dark:border-ui-darkBorder rounded p-2 text-ui-lightText dark:text-ui-darkText focus:ring-2 focus:ring-accent-primary outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-ui-lightMuted dark:text-ui-darkMuted mb-1">المصاريف (ج.م)</label>
            <input 
              type="number" 
              value={expenses} 
              onChange={(e) => setExpenses(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full bg-ui-lightBg dark:bg-ui-darkBg border border-ui-lightBorder dark:border-ui-darkBorder rounded p-2 text-ui-lightText dark:text-ui-darkText focus:ring-2 focus:ring-accent-primary outline-none"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
             <div>
                <label className="block text-sm text-ui-lightMuted dark:text-ui-darkMuted mb-1">الشهر</label>
                <input type="number" min="1" max="12" value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-full bg-ui-lightBg dark:bg-ui-darkBg border border-ui-lightBorder dark:border-ui-darkBorder rounded p-2 text-ui-lightText dark:text-ui-darkText focus:ring-2 focus:ring-accent-primary outline-none" />
             </div>
             <div>
                <label className="block text-sm text-ui-lightMuted dark:text-ui-darkMuted mb-1">السنة</label>
                <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full bg-ui-lightBg dark:bg-ui-darkBg border border-ui-lightBorder dark:border-ui-darkBorder rounded p-2 text-ui-lightText dark:text-ui-darkText focus:ring-2 focus:ring-accent-primary outline-none" />
             </div>
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full">إضافة الحملة</Button>
          </div>
        </form>
      </Card>

      <Card>
        <h3 className="text-xl font-semibold mb-4 text-ui-lightText dark:text-ui-darkText">قائمة الحملات</h3>
        <div className="overflow-x-auto rounded-lg border border-ui-lightBorder dark:border-ui-darkBorder">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-ui-lightBg dark:bg-white/5 border-b border-ui-lightBorder dark:border-ui-darkBorder">
                <th className="p-3 text-ui-lightMuted dark:text-ui-darkMuted">الحملة</th>
                <th className="p-3 text-ui-lightMuted dark:text-ui-darkMuted">المصاريف</th>
                <th className="p-3 text-ui-lightMuted dark:text-ui-darkMuted">الفترة</th>
                <th className="p-3 text-center text-ui-lightMuted dark:text-ui-darkMuted">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ui-lightBorder dark:divide-ui-darkBorder">
              {campaigns.map(c => (
                <tr key={c.id} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td className="p-3 font-medium text-ui-lightText dark:text-ui-darkText">{c.name}</td>
                  <td className="p-3 font-bold text-accent-error">{c.expenses.toLocaleString()} ج.م</td>
                  <td className="p-3 text-ui-lightMuted dark:text-ui-darkMuted">{c.month} / {c.year}</td>
                  <td className="p-3 text-center">
                    <Button variant="danger" size="sm" onClick={() => handleDelete(c.id)}>حذف</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default CampaignManagement;
