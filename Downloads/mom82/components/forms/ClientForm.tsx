
import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import Card from '../common/Card';
import { Client, Employee, Department } from '../../types';
import { DataService } from '../../services/dataService';
import Alert from '../common/Alert';
import { DEPARTMENT_AR_MAP } from '../../constants';

interface ClientFormProps {
  client?: Client | null; // Optional prop for editing
  onClose: () => void;
  onSubmit: (client: Client | Omit<Client, 'id' | 'acquisition_date'>) => Promise<void>;
  isModal?: boolean;
  employees: Employee[]; // Pass employees for dropdown
}

const ClientForm: React.FC<ClientFormProps> = ({ client, onClose, onSubmit, isModal = false, employees }) => {
  const [name, setName] = useState(client?.name || '');
  const [contactInfo, setContactInfo] = useState(client?.contact_info || '');
  const [sourceDept, setSourceDept] = useState<Department>(client?.source_department || Department.Marketing);
  const [acquisitionDate, setAcquisitionDate] = useState(client?.acquisition_date ? new Date(client.acquisition_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [initialRevenue, setInitialRevenue] = useState<number | ''>(client?.initial_revenue || '');
  const [notes, setNotes] = useState(client?.notes || '');
  
  // Logic for Source Type
  const [sourceType, setSourceType] = useState<'employee' | 'external'>('employee');
  const [acquiredByEmployeeId, setAcquiredByEmployeeId] = useState(client?.acquired_by_employee_id || '');
  const [externalSource, setExternalSource] = useState(client?.acquisition_source || 'Ads');

  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (client) {
      setName(client.name);
      setContactInfo(client.contact_info);
      setSourceDept(client.source_department);
      setAcquisitionDate(new Date(client.acquisition_date).toISOString().split('T')[0]);
      setInitialRevenue(client.initial_revenue);
      setNotes(client.notes || '');
      
      // Determine Source Type
      if (client.acquired_by_employee_id) {
          setSourceType('employee');
          setAcquiredByEmployeeId(client.acquired_by_employee_id);
      } else {
          setSourceType('external');
          setExternalSource(client.acquisition_source || 'Ads');
      }
    } else {
      // Default behavior
      if (employees.length > 0) {
        setAcquiredByEmployeeId(employees[0].id);
      }
    }
  }, [client, employees]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('الرجاء إدخال اسم العميل.');
      return;
    }
    if (!contactInfo.trim()) {
      setFormError('الرجاء إدخال معلومات الاتصال بالعميل.');
      return;
    }
    
    // Validation based on Source Type
    if (sourceType === 'employee' && !acquiredByEmployeeId) {
        setFormError('الرجاء اختيار الموظف المسؤول.');
        return;
    }
    if (sourceType === 'external' && !externalSource) {
        setFormError('الرجاء تحديد المصدر الخارجي.');
        return;
    }

    if (!acquisitionDate) {
        setFormError('الرجاء تحديد تاريخ جلب العميل.');
        return;
    }
    if (initialRevenue === '' || isNaN(Number(initialRevenue)) || Number(initialRevenue) < 0) {
      setFormError('الرجاء إدخال إيراد أولي صحيح وموجب.');
      return;
    }

    const clientData = {
      name,
      contact_info: contactInfo,
      source_department: sourceDept,
      // Logic for DB Columns
      acquired_by_employee_id: sourceType === 'employee' ? acquiredByEmployeeId : null,
      acquisition_source: sourceType === 'external' ? externalSource : null,
      
      acquisition_date: new Date(acquisitionDate),
      initial_revenue: Number(initialRevenue),
      notes,
    };

    try {
        if (client) {
          await onSubmit({ ...client, ...clientData });
        } else {
          await onSubmit(clientData);
        }
        onClose();
    } catch (err: any) {
        setFormError("فشل حفظ بيانات العميل: " + err.message);
    }
  };

  const FormContent = (
    <Card className="p-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-4">
        {client ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
      </h3>
      {formError && <Alert type="error" message={formError} className="mb-4" onClose={() => setFormError(null)} />}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            اسم العميل
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="contactInfo" className="block text-sm font-medium text-gray-700">
            معلومات الاتصال (بريد إلكتروني أو هاتف)
          </label>
          <input
            type="text"
            id="contactInfo"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="sourceDept" className="block text-sm font-medium text-gray-700">
            القسم المصدر
          </label>
          <select
            id="sourceDept"
            value={sourceDept}
            onChange={(e) => setSourceDept(e.target.value as Department)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            {Object.values(Department).map((d) => (
              <option key={d} value={d}>{DEPARTMENT_AR_MAP[d]}</option>
            ))}
          </select>
        </div>

        {/* Source Selection Toggle */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <span className="block text-sm font-bold text-gray-700 mb-2">طريقة جلب العميل:</span>
            <div className="flex gap-4 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                        type="radio" 
                        name="sourceType" 
                        value="employee" 
                        checked={sourceType === 'employee'} 
                        onChange={() => setSourceType('employee')} 
                        className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm">بواسطة موظف</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                        type="radio" 
                        name="sourceType" 
                        value="external" 
                        checked={sourceType === 'external'} 
                        onChange={() => setSourceType('external')} 
                        className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm">مصدر خارجي (Ads / Organic)</span>
                </label>
            </div>

            {sourceType === 'employee' ? (
                <div>
                    <select
                        value={acquiredByEmployeeId}
                        onChange={(e) => setAcquiredByEmployeeId(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                        <option value="" disabled>اختر موظفًا...</option>
                        {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                    </select>
                </div>
            ) : (
                <div>
                    <select
                        value={externalSource}
                        onChange={(e) => setExternalSource(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-bold text-indigo-700"
                    >
                        <option value="Ads">Ads (إعلانات ممولة)</option>
                        <option value="Organic">Organic (سوشيال ميديا / بحث)</option>
                        <option value="Referral">Referral (ترشيح خارجي)</option>
                    </select>
                </div>
            )}
        </div>

        <div>
          <label htmlFor="acquisitionDate" className="block text-sm font-medium text-gray-700">
            تاريخ الجلب
          </label>
          <input
            type="date"
            id="acquisitionDate"
            value={acquisitionDate}
            onChange={(e) => setAcquisitionDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-right"
            required
          />
        </div>
        <div>
          <label htmlFor="initialRevenue" className="block text-sm font-medium text-gray-700">
            الإيراد الأولي (جنيه مصري)
          </label>
          <input
            type="number"
            id="initialRevenue"
            value={initialRevenue}
            onChange={(e) => setInitialRevenue(e.target.value !== '' ? parseFloat(e.target.value) : '')}
            min="0"
            step="0.01"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-right"
            required
          />
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            ملاحظات (اختياري)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          ></textarea>
        </div>
        <div className="flex justify-end space-x-3 rtl:space-x-reverse">
          <Button type="button" variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary">
            {client ? 'تحديث العميل' : 'إضافة العميل'}
          </Button>
        </div>
      </form>
    </Card>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
        <div className="relative p-5 w-full max-w-lg mx-auto bg-white rounded-lg shadow-lg">
          {FormContent}
        </div>
      </div>
    );
  }

  return FormContent;
};

export default ClientForm;
