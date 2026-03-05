
import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import IframeViewer from '../components/common/IframeViewer'; // New component
import { DataService } from '../services/dataService';
import { AuthService } from '../services/authService';
import LoadingSpinner from '../components/common/LoadingSpinner';

const CataloguesPage: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [generalUrl, setGeneralUrl] = useState('');
  const [personalUrl, setPersonalUrl] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [tempUrl, setTempUrl] = useState('');

  useEffect(() => {
    const init = async () => {
      const session = await AuthService.getCurrentSession();
      setIsAdmin(!!session?.isAdmin);
      
      const savedGeneral = await DataService.getSiteConfig('general_catalog_url');
      setGeneralUrl(savedGeneral || '');

      if (session?.employeeId) {
        const emp = await DataService.getEmployee(session.employeeId);
        setPersonalUrl(emp?.personal_catalog_url || '');
      }
      setLoading(false);
    };
    init();
  }, []);

  const handleSaveUrl = async () => {
    if (!tempUrl.trim()) return;
    try {
        await DataService.updateSiteConfig('general_catalog_url', tempUrl);
        setGeneralUrl(tempUrl);
        setIsEditing(false);
        alert('تم تحديث رابط الكتالوج العام بنجاح');
    } catch (err: any) {
        alert('فشل الحفظ: ' + err.message);
    }
  };

  const startEditing = () => {
      setTempUrl(generalUrl);
      setIsEditing(true);
  };

  if (loading) return <div className="p-10 text-center"><LoadingSpinner /></div>;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-brand-charcoal">📚 مركز الكتالوجات الرقمية</h2>
        {isAdmin && (
          <Button onClick={() => isEditing ? setIsEditing(false) : startEditing()} variant="outline">
              {isEditing ? 'إلغاء' : 'تحديث رابط الكتالوج'}
          </Button>
        )}
      </div>

      {isEditing && isAdmin && (
        <Card className="bg-indigo-50 border border-indigo-200 mb-6 animate-in fade-in slide-in-from-top-4">
            <h4 className="font-bold mb-4 text-indigo-900">تحديث الكتالوج العام</h4>
            <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-500">رابط التضمين (Embed URL) أو رابط الملف المباشر:</label>
                <div className="flex gap-2">
                    <input 
                        type="url" 
                        value={tempUrl}
                        onChange={(e) => setTempUrl(e.target.value)}
                        placeholder="https://example.com/file.pdf"
                        className="flex-1 p-3 rounded-xl border border-gray-300 text-sm ltr"
                        dir="ltr"
                    />
                    <Button onClick={handleSaveUrl} className="bg-indigo-600 text-white">حفظ</Button>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                    يمكنك استخدام روابط من Google Drive (وضع المعاينة) أو أي موقع استضافة ملفات PDF.
                </p>
            </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* General Catalogue */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
             <span className="text-2xl">🌍</span>
             <h3 className="text-xl font-bold">الكتالوج العام</h3>
          </div>
          {generalUrl ? (
            <IframeViewer url={generalUrl} title="الكتالوج العام" />
          ) : <Alert type="info" message="لا يوجد كتالوج عام حالياً." />}
        </div>

        {/* Personal Catalogue */}
        {!isAdmin && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">👤</span>
                <h3 className="text-xl font-bold">الكتالوج الشخصي</h3>
            </div>
            {personalUrl ? (
              <IframeViewer url={personalUrl} title="الكتالوج الشخصي" />
            ) : <Alert type="warning" message="لم يتم تخصيص كتالوج شخصي لك بعد." />}
          </div>
        )}
        
        {isAdmin && (
           <div className="p-8 bg-gray-50 rounded-3xl border border-dashed border-gray-300 flex flex-col justify-center items-center text-center">
               <span className="text-4xl mb-4">💡</span>
               <h4 className="font-bold text-gray-700">تلميح للمدير</h4>
               <p className="text-sm text-gray-500 mt-2 max-w-xs">
                   لتحديث الكتالوج الشخصي للموظف، اذهب لصفحة الموظف وقم بتعديل بياناته بوضع رابط الكتالوج الخاص به في حقل "رابط الكتالوج الشخصي".
               </p>
           </div>
        )}
      </div>
    </div>
  );
};

export default CataloguesPage;
