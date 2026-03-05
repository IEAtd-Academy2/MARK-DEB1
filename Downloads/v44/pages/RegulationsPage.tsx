
import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import IframeViewer from '../components/common/IframeViewer'; // New component
import { DataService } from '../services/dataService';
import { AuthService } from '../services/authService';
import LoadingSpinner from '../components/common/LoadingSpinner';

const RegulationsPage: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [tempUrl, setTempUrl] = useState('');

  useEffect(() => {
    const init = async () => {
      const session = await AuthService.getCurrentSession();
      setIsAdmin(!!session?.isAdmin);
      const savedUrl = await DataService.getSiteConfig('admin_regulations_url');
      setUrl(savedUrl || '');
      setLoading(false);
    };
    init();
  }, []);

  const handleSaveUrl = async () => {
    if (!tempUrl.trim()) return;
    try {
        await DataService.updateSiteConfig('admin_regulations_url', tempUrl);
        setUrl(tempUrl);
        setIsEditing(false);
        alert('تم تحديث رابط اللائحة بنجاح');
    } catch (err: any) {
        alert('فشل الحفظ: ' + err.message);
    }
  };

  const startEditing = () => {
      setTempUrl(url);
      setIsEditing(true);
  };

  if (loading) return <div className="p-10 text-center"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-brand-charcoal">⚖️ اللائحة الإدارية والقواعد</h2>
        {isAdmin && (
          <Button onClick={() => isEditing ? setIsEditing(false) : startEditing()} variant="outline">
              {isEditing ? 'إلغاء' : 'تحديث اللائحة'}
          </Button>
        )}
      </div>

      {isEditing && isAdmin && (
        <Card className="border-2 border-brand-red bg-red-50 mb-6 animate-in fade-in slide-in-from-top-4">
          <label className="block text-sm font-bold mb-2 text-red-900">رابط ملف اللائحة (PDF / Embed URL):</label>
          <div className="flex gap-2">
            <input 
              type="url" 
              value={tempUrl}
              onChange={(e) => setTempUrl(e.target.value)}
              placeholder="https://example.com/rules.pdf"
              className="flex-1 p-3 rounded-lg border border-red-200 text-sm ltr"
              dir="ltr"
            />
            <Button onClick={handleSaveUrl} className="bg-red-600 text-white hover:bg-red-700">حفظ</Button>
          </div>
        </Card>
      )}

      {url ? (
        <div className="flex justify-center">
             <IframeViewer url={url} title="اللائحة الإدارية" />
        </div>
      ) : (
        <Alert type="info" message="لم يتم إضافة رابط اللائحة الإدارية بعد." />
      )}
    </div>
  );
};

export default RegulationsPage;
