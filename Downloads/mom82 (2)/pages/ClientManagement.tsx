
import React, { useState, useEffect, useCallback } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { DataService } from '../services/dataService';
import { Client, Employee, Department } from '../types';
import ClientForm from '../components/forms/ClientForm';
import { DEPARTMENT_AR_MAP } from '../constants';


const ClientManagement: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]); // To map employee IDs to names
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  const fetchClientsAndEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedClients = await DataService.getAllClients();
      const fetchedEmployees = await DataService.getAllEmployees();
      setClients(fetchedClients);
      setEmployees(fetchedEmployees);
    } catch (err: any) {
      console.error("فشل جلب بيانات العملاء:", err);
      let msg = err.message;
      if (msg.includes('Failed to fetch')) {
        msg = "تعذر الاتصال بقاعدة البيانات. تأكد من أن مشروع Supabase نشط وأن الاتصال بالإنترنت يعمل.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClientsAndEmployees();
  }, [fetchClientsAndEmployees]);

  const getClientSource = (client: Client): React.ReactNode => {
    // If linked to an employee
    if (client.acquired_by_employee_id) {
        const emp = employees.find(e => e.id === client.acquired_by_employee_id);
        return <span className="font-bold text-gray-700 dark:text-gray-300">👤 {emp ? emp.name : 'موظف غير معروف'}</span>;
    }
    
    // If External Source
    if (client.acquisition_source) {
        if (client.acquisition_source === 'Ads') {
            return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-200">📢 Ads (ممولة)</span>;
        }
        if (client.acquisition_source === 'Organic') {
            return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200">🌿 Organic</span>;
        }
        return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold">{client.acquisition_source}</span>;
    }

    return <span className="text-gray-400 text-xs">غير محدد</span>;
  };

  const handleAddClient = () => {
    setEditingClient(null);
    setShowClientForm(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setShowClientForm(true);
  };

  const handleDeleteClient = (clientId: string) => {
    setClientToDelete(clientId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteClient = async () => {
    if (clientToDelete) {
      try {
        await DataService.deleteClient(clientToDelete);
        setShowDeleteConfirm(false);
        setClientToDelete(null);
        fetchClientsAndEmployees(); // Refresh data
      } catch (err: any) {
        setError("فشل حذف العميل: " + err.message);
      }
    }
  };

  const handleClientFormSubmit = async (clientData: Omit<Client, 'id' | 'acquisition_date'> | Client) => {
    try {
      if ('id' in clientData && clientData.id) {
        await DataService.updateClient(clientData as Client);
      } else {
        await DataService.addClient(clientData as Omit<Client, 'id' | 'acquisition_date'>);
      }
      setShowClientForm(false);
      fetchClientsAndEmployees(); // Refresh data
    } catch (err: any) {
      setError("فشل حفظ بيانات العميل: " + err.message);
    }
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner />
        <p className="ml-2 text-gray-700">جاري تحميل بيانات العملاء...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-ui-lightText dark:text-ui-darkText">إدارة العملاء</h2>
        <Button onClick={handleAddClient}>+ إضافة عميل</Button>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-ui-lightBg dark:bg-white/5 border-b border-ui-lightBorder dark:border-ui-darkBorder">
                <th className="p-3 text-ui-lightMuted dark:text-ui-darkMuted">اسم العميل</th>
                <th className="p-3 text-ui-lightMuted dark:text-ui-darkMuted">جهة الاتصال</th>
                <th className="p-3 text-ui-lightMuted dark:text-ui-darkMuted">القسم</th>
                <th className="p-3 text-ui-lightMuted dark:text-ui-darkMuted">المصدر (بواسطة)</th>
                <th className="p-3 text-ui-lightMuted dark:text-ui-darkMuted">الإيراد</th>
                <th className="p-3 text-center text-ui-lightMuted dark:text-ui-darkMuted">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ui-lightBorder dark:divide-ui-darkBorder">
              {clients.map(client => (
                <tr key={client.id} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td className="p-3 font-medium text-ui-lightText dark:text-ui-darkText">{client.name}</td>
                  <td className="p-3 text-sm text-ui-lightMuted dark:text-ui-darkMuted">{client.contact_info}</td>
                  <td className="p-3 text-sm">{DEPARTMENT_AR_MAP[client.source_department]}</td>
                  <td className="p-3 text-sm">{getClientSource(client)}</td>
                  <td className="p-3 font-bold text-green-600">{client.initial_revenue.toLocaleString()} ج.م</td>
                  <td className="p-3 text-center flex justify-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleEditClient(client)}>تعديل</Button>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteClient(client.id)}>حذف</Button>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">لا يوجد عملاء حالياً.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showClientForm && (
        <ClientForm
          client={editingClient}
          employees={employees}
          onClose={() => setShowClientForm(false)}
          onSubmit={handleClientFormSubmit}
          isModal={true}
        />
      )}

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteClient}
        title="حذف عميل"
        message="هل أنت متأكد من رغبتك في حذف هذا العميل؟ لا يمكن التراجع عن هذا الإجراء."
      />
    </div>
  );
};

export default ClientManagement;
