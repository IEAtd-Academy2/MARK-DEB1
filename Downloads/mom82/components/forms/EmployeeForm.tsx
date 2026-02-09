
import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import Card from '../common/Card';
import { Employee, Role, Department, TaskColumn, ColumnPermission, PasswordCategory } from '../../types';
import { DEPARTMENT_AR_MAP, ROLE_AR_MAP, PLAN_SHEET_TABS, SYSTEM_SECTIONS } from '../../constants';
import Alert from '../common/Alert';
import { DataService } from '../../services/dataService';

interface EmployeeFormProps {
  employee?: Employee | null;
  onClose: () => void;
  onSubmit: (employee: Employee | Omit<Employee, 'id'>) => Promise<void>;
  isModal?: boolean;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ employee, onClose, onSubmit, isModal = false }) => {
  const [name, setName] = useState(employee?.name || '');
  const [email, setEmail] = useState(employee?.email || '');
  const [baseSalary, setBaseSalary] = useState<number | ''>(employee?.base_salary || '');
  const [role, setRole] = useState<Role>(employee?.role || Role.MarketingManager);
  const [department, setDepartment] = useState<Department>(employee?.department || Department.Marketing);
  
  const [personalCatalogUrl, setPersonalCatalogUrl] = useState(employee?.personal_catalog_url || '');
  
  const [isSalesSpecialist, setIsSalesSpecialist] = useState(employee?.is_sales_specialist || false);
  const [salesCommissionRate, setSalesCommissionRate] = useState<number | ''>(employee?.sales_commission_rate || '');
  const [monthlySalesTarget, setMonthlySalesTarget] = useState<number | ''>(employee?.monthly_sales_target || '');
  
  const [leaveBalance, setLeaveBalance] = useState<number>(employee?.leave_balance ?? 21);
  const [defaultIncentive, setDefaultIncentive] = useState<number>(employee?.default_incentive ?? 1000);

  const [planPermissions, setPlanPermissions] = useState<Record<string, 'view' | 'edit'>>(employee?.plan_permissions || {});
  const [columnPermissions, setColumnPermissions] = useState<Record<string, ColumnPermission>>(employee?.column_permissions || {});
  
  // Vault Permissions
  const [vaultPermissions, setVaultPermissions] = useState<Record<string, 'view' | 'edit'>>(employee?.vault_permissions || {});
  const [allVaultCategories, setAllVaultCategories] = useState<PasswordCategory[]>([]);

  // Navigation Permissions
  const [navPermissions, setNavPermissions] = useState<Record<string, boolean>>(employee?.nav_permissions || {
      'my_profile': true, 
      'my_reports': true, 
      'tasks': true, 
      'catalogues': true, 
      'regulations': true,
      'active_campaigns': true,
      'vault': true
  });

  const [allColumns, setAllColumns] = useState<TaskColumn[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    DataService.getTaskColumns().then(setAllColumns).catch(console.error);
    DataService.getPasswordCategories().then(setAllVaultCategories).catch(console.error);

    if (employee) {
      setName(employee.name);
      setEmail(employee.email);
      setBaseSalary(employee.base_salary);
      setRole(employee.role);
      setDepartment(employee.department);
      setPersonalCatalogUrl(employee.personal_catalog_url || '');
      setIsSalesSpecialist(employee.is_sales_specialist || false);
      setSalesCommissionRate(employee.sales_commission_rate || '');
      setMonthlySalesTarget(employee.monthly_sales_target || '');
      setLeaveBalance(employee.leave_balance ?? 21);
      setDefaultIncentive(employee.default_incentive ?? 1000);
      setPlanPermissions(employee.plan_permissions || {});
      setColumnPermissions(employee.column_permissions || {});
      setVaultPermissions(employee.vault_permissions || {});
      if (employee.nav_permissions) setNavPermissions(employee.nav_permissions);
    }
  }, [employee]);

  const handleVaultPermissionChange = (catId: string, level: 'none' | 'view' | 'edit') => {
      const newPerms = { ...vaultPermissions };
      if (level === 'none') delete newPerms[catId];
      else newPerms[catId] = level;
      setVaultPermissions(newPerms);
  };

  const handlePermissionChange = (tabId: string, level: 'none' | 'view' | 'edit') => {
      const newPerms = { ...planPermissions };
      if (level === 'none') delete newPerms[tabId];
      else newPerms[tabId] = level;
      setPlanPermissions(newPerms);
  };

  const handleColumnPermissionChange = (colId: string, perm: ColumnPermission) => {
      setColumnPermissions(prev => ({ ...prev, [colId]: perm }));
  };

  const handleNavPermissionChange = (key: string, checked: boolean) => {
      setNavPermissions({ ...navPermissions, [key]: checked });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const employeeData: Omit<Employee, 'id'> = {
      name,
      email,
      base_salary: Number(baseSalary),
      role,
      department,
      personal_catalog_url: personalCatalogUrl,
      is_sales_specialist: isSalesSpecialist,
      sales_commission_rate: isSalesSpecialist ? Number(salesCommissionRate) : undefined,
      monthly_sales_target: isSalesSpecialist ? Number(monthlySalesTarget) : undefined,
      leave_balance: leaveBalance,
      default_incentive: defaultIncentive,
      can_view_plans: navPermissions['plans'] || false,
      plan_permissions: planPermissions,
      column_permissions: columnPermissions,
      nav_permissions: navPermissions,
      vault_permissions: vaultPermissions
    };

    try {
        if (employee) await onSubmit({ ...employee, ...employeeData });
        else await onSubmit(employeeData);
        onClose();
    } catch (err: any) {
        setFormError(err.message);
    }
  };

  const FormContent = (
    <Card className="p-8 max-h-[90vh] overflow-y-auto">
      <h3 className="text-xl font-bold mb-6">
        {employee ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
      </h3>
      {formError && <Alert type="error" message={formError} className="mb-4 text-xs" />}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-ui-lightMuted dark:text-ui-darkMuted uppercase">الاسم الكامل</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-ui-lightBg dark:bg-ui-darkBg p-3 rounded-xl border border-ui-lightBorder dark:border-ui-darkBorder text-sm outline-none focus:border-accent-primary" required />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-ui-lightMuted dark:text-ui-darkMuted uppercase">البريد الإلكتروني</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-ui-lightBg dark:bg-ui-darkBg p-3 rounded-xl border border-ui-lightBorder dark:border-ui-darkBorder text-sm outline-none focus:border-accent-primary" required />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-ui-lightMuted dark:text-ui-darkMuted uppercase">المسمى الوظيفي</label>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="w-full bg-ui-lightBg dark:bg-ui-darkBg p-3 rounded-xl border border-ui-lightBorder dark:border-ui-darkBorder text-sm">
              {Object.values(Role).map(r => <option key={r} value={r}>{ROLE_AR_MAP[r]}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-ui-lightMuted dark:text-ui-darkMuted uppercase">القسم</label>
            <select value={department} onChange={(e) => setDepartment(e.target.value as Department)} className="w-full bg-ui-lightBg dark:bg-ui-darkBg p-3 rounded-xl border border-ui-lightBorder dark:border-ui-darkBorder text-sm">
              {Object.values(Department).map(d => <option key={d} value={d}>{DEPARTMENT_AR_MAP[d]}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
                <label className="text-[10px] font-bold text-ui-lightMuted dark:text-ui-darkMuted uppercase">الراتب الأساسي</label>
                <input type="number" value={baseSalary} onChange={(e) => setBaseSalary(Number(e.target.value))} className="w-full bg-ui-lightBg dark:bg-ui-darkBg p-3 rounded-xl border border-ui-lightBorder dark:border-ui-darkBorder text-sm" required />
            </div>
            <div className="space-y-1">
                <label className="text-[10px] font-bold text-ui-lightMuted dark:text-ui-darkMuted uppercase">رصيد الإجازات</label>
                <input type="number" value={leaveBalance} onChange={(e) => setLeaveBalance(Number(e.target.value))} className="w-full bg-ui-lightBg dark:bg-ui-darkBg p-3 rounded-xl border border-ui-lightBorder dark:border-ui-darkBorder text-sm" required />
            </div>
            <div className="space-y-1">
                <label className="text-[10px] font-bold text-ui-lightMuted dark:text-ui-darkMuted uppercase text-indigo-600">الحافز الافتراضي (&lt; 65%)</label>
                <input type="number" value={defaultIncentive} onChange={(e) => setDefaultIncentive(Number(e.target.value))} className="w-full bg-ui-lightBg dark:bg-ui-darkBg p-3 rounded-xl border border-indigo-200 dark:border-indigo-800 text-sm font-bold" required />
            </div>
        </div>
        
        {/* === Navigation Permissions === */}
        <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10">
            <p className="text-xs font-black text-blue-900 dark:text-blue-200 uppercase mb-3">صلاحيات القوائم (Navigation Visibility)</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {SYSTEM_SECTIONS.filter(s => !s.adminOnly).map(section => (
                    <label key={section.key} className="flex items-center gap-2 p-2 bg-white dark:bg-white/10 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-white/20 transition-colors">
                        <input 
                            type="checkbox"
                            checked={!!navPermissions[section.key]}
                            onChange={(e) => handleNavPermissionChange(section.key, e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">{section.label}</span>
                    </label>
                ))}
            </div>
        </div>

        {/* Vault Category Permissions (NEW) */}
        {navPermissions['vault'] && (
            <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/10">
                 <p className="text-[10px] font-black text-purple-900 dark:text-purple-200 uppercase mb-3">صلاحيات خزنة الحسابات</p>
                 <div className="space-y-2 max-h-[200px] overflow-y-auto">
                     {allVaultCategories.map(cat => {
                         const currentPerm = vaultPermissions[cat.id] || 'none';
                         return (
                             <div key={cat.id} className="flex justify-between items-center text-xs bg-white dark:bg-white/10 p-2 rounded-lg">
                                 <span className="font-bold text-gray-700 dark:text-gray-300">{cat.icon} {cat.name}</span>
                                 <div className="flex bg-gray-100 dark:bg-white/10 rounded-lg p-1">
                                     <button type="button" onClick={() => handleVaultPermissionChange(cat.id, 'none')} className={`px-3 py-1 rounded-md text-[10px] transition-colors ${currentPerm === 'none' ? 'bg-white shadow text-red-500' : 'text-gray-400'}`}>إخفاء</button>
                                     <button type="button" onClick={() => handleVaultPermissionChange(cat.id, 'view')} className={`px-3 py-1 rounded-md text-[10px] transition-colors ${currentPerm === 'view' ? 'bg-white shadow text-blue-500' : 'text-gray-400'}`}>مشاهدة</button>
                                     <button type="button" onClick={() => handleVaultPermissionChange(cat.id, 'edit')} className={`px-3 py-1 rounded-md text-[10px] transition-colors ${currentPerm === 'edit' ? 'bg-white shadow text-green-600 font-bold' : 'text-gray-400'}`}>تعديل</button>
                                 </div>
                             </div>
                         );
                     })}
                 </div>
            </div>
        )}

        {/* Kanban Column Permissions */}
        <div className="p-4 rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10">
            <p className="text-xs font-black text-orange-900 dark:text-orange-200 uppercase mb-3">صلاحيات أعمدة المهام (Kanban)</p>
            <div className="grid grid-cols-1 gap-2">
                {allColumns.map(col => (
                    <div key={col.id} className="flex items-center justify-between bg-white dark:bg-white/10 p-2 rounded-lg border border-orange-100 dark:border-white/5">
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{col.title}</span>
                        <select value={columnPermissions[col.id] || 'edit'} onChange={(e) => handleColumnPermissionChange(col.id, e.target.value as ColumnPermission)} className="text-xs p-1 rounded border border-gray-300 dark:border-gray-600 bg-transparent">
                            <option value="edit">تعديل كامل</option>
                            <option value="view">مشاهدة فقط</option>
                            <option value="hidden">إخفاء</option>
                        </select>
                    </div>
                ))}
            </div>
        </div>

        {/* Plans Granular Permission */}
        {navPermissions['plans'] && (
            <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/10">
                 <p className="text-[10px] font-black text-indigo-900 dark:text-indigo-200 uppercase mb-3">تفاصيل صلاحيات "الخطط والعمليات"</p>
                 <div className="space-y-2 max-h-[200px] overflow-y-auto">
                     {PLAN_SHEET_TABS.map(tab => {
                         const currentPerm = planPermissions[tab.id] || 'none';
                         return (
                             <div key={tab.id} className="flex justify-between items-center text-xs bg-white dark:bg-white/10 p-2 rounded-lg">
                                 <span className="font-bold text-gray-700 dark:text-gray-300">{tab.label}</span>
                                 <div className="flex bg-gray-100 dark:bg-white/10 rounded-lg p-1">
                                     <button type="button" onClick={() => handlePermissionChange(tab.id, 'none')} className={`px-3 py-1 rounded-md text-[10px] transition-colors ${currentPerm === 'none' ? 'bg-white shadow text-red-500' : 'text-gray-400'}`}>إخفاء</button>
                                     <button type="button" onClick={() => handlePermissionChange(tab.id, 'view')} className={`px-3 py-1 rounded-md text-[10px] transition-colors ${currentPerm === 'view' ? 'bg-white shadow text-blue-500' : 'text-gray-400'}`}>مشاهدة</button>
                                     <button type="button" onClick={() => handlePermissionChange(tab.id, 'edit')} className={`px-3 py-1 rounded-md text-[10px] transition-colors ${currentPerm === 'edit' ? 'bg-white shadow text-green-600 font-bold' : 'text-gray-400'}`}>تعديل</button>
                                 </div>
                             </div>
                         );
                     })}
                 </div>
            </div>
        )}

        {/* Sales Specialist Toggle */}
        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5">
             <div className="flex items-center gap-2 mb-3">
                 <input type="checkbox" id="isSales" checked={isSalesSpecialist} onChange={(e) => setIsSalesSpecialist(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded" />
                 <label htmlFor="isSales" className="text-xs font-bold uppercase select-none cursor-pointer">هل هذا الموظف أخصائي مبيعات؟</label>
             </div>
             {isSalesSpecialist && (
                 <div className="grid grid-cols-2 gap-4 pl-6 animate-in fade-in slide-in-from-top-2">
                    <div>
                        <label className="text-[10px] block font-bold text-gray-500 mb-1">Target الشهري</label>
                        <input type="number" value={monthlySalesTarget} onChange={(e) => setMonthlySalesTarget(Number(e.target.value))} className="w-full p-2 rounded-lg border text-sm" />
                    </div>
                    <div>
                        <label className="text-[10px] block font-bold text-gray-500 mb-1">نسبة العمولة</label>
                        <input type="number" step="0.01" value={salesCommissionRate} onChange={(e) => setSalesCommissionRate(Number(e.target.value))} className="w-full p-2 rounded-lg border text-sm" />
                    </div>
                 </div>
             )}
        </div>

        <div className="p-4 bg-ui-lightBg dark:bg-ui-darkBg rounded-2xl border border-dashed border-ui-lightBorder dark:border-ui-darkBorder">
          <label className="text-[10px] font-black text-accent-primary uppercase mb-2 block">رابط الكتالوج الشخصي (PDF URL)</label>
          <input type="url" value={personalCatalogUrl} onChange={(e) => setPersonalCatalogUrl(e.target.value)} placeholder="https://example.com/catalog.pdf" className="w-full bg-white dark:bg-black/20 p-3 rounded-lg border border-gray-300 dark:border-gray-600 text-sm ltr" dir="ltr" />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-ui-lightBorder dark:border-ui-darkBorder">
          <Button type="button" variant="secondary" onClick={onClose} className="px-6 py-2 text-xs font-bold text-ui-lightMuted">إلغاء</Button>
          <button type="submit" className="bg-ui-lightText dark:bg-ui-darkText text-ui-lightCard dark:text-ui-darkBg px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg">حفظ الموظف</button>
        </div>
      </form>
    </Card>
  );

  return isModal ? (
    <div className="fixed inset-0 bg-ui-lightBg/80 dark:bg-ui-darkBg/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="w-full max-w-2xl">{FormContent}</div>
    </div>
  ) : FormContent;
};

export default EmployeeForm;
