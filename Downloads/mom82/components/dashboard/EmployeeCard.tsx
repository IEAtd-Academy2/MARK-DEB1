
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../common/Card';
import ProgressBar from '../common/ProgressBar';
import { EmployeeSummary, Department, Role, Employee } from '../../types';
import { DEPARTMENT_AR_MAP, ROLE_AR_MAP } from '../../constants';

interface EmployeeCardProps {
  summary: EmployeeSummary;
  onEdit: (employee: Employee) => void;
  onDelete: (employeeId: string) => void;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({ summary, onEdit, onDelete }) => {
  const navigate = useNavigate();

  const handleViewProfile = () => {
    navigate(`/employee/${summary.employee.id}`);
  };

  return (
    <Card className="flex flex-col justify-between group hover:border-ui-lightText/10 dark:hover:border-white/20 transition-all p-8">
      <div>
        <div className="flex justify-between items-start mb-6">
           <div>
              <h3 className="text-xl font-black text-ui-lightText dark:text-white tracking-tighter group-hover:text-accent-primary transition-colors">{summary.employee.name}</h3>
              <p className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">
                {ROLE_AR_MAP[summary.employee.role as Role]}
              </p>
           </div>
           <div className="w-10 h-10 rounded-xl bg-ui-lightBg dark:bg-ui-darkBg border border-ui-lightBorder dark:border-ui-darkBorder flex items-center justify-center text-lg">
             {summary.employee.department === 'Sales' ? '💰' : '⚙️'}
           </div>
        </div>

        <div className="space-y-5 mb-8">
          <ProgressBar
            label="معدل الأداء"
            progress={summary.totalKpiProgress}
            className="text-xs"
            barColor="bg-ui-lightText dark:bg-white"
          />
          <ProgressBar
            label="الالتزام بالوقت"
            progress={summary.onTimeRate}
            className="text-xs"
            barColor="bg-ui-lightText/20 dark:bg-white/20"
          />
        </div>

        <div className="bg-ui-lightBg dark:bg-ui-darkBg p-4 rounded-2xl border border-ui-lightBorder dark:border-ui-darkBorder mb-6">
          <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase mb-1">صافي الراتب المتوقع</p>
          <p className="text-lg font-black text-ui-lightText dark:text-white">
            {summary.currentExpectedPayout.toLocaleString()} <span className="text-[10px] opacity-60">ج.م</span>
          </p>
        </div>

        {summary.moodAlerts.length > 0 && (
          <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-2xl border border-orange-100 dark:border-orange-900/30">
            <p className="text-[9px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-2">تنبيهات السلوك</p>
            <ul className="space-y-1">
              {summary.moodAlerts.map((alert, index) => (
                <li key={index} className="text-[10px] font-bold text-orange-800 dark:text-orange-300">• {alert}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <button 
          onClick={handleViewProfile} 
          className="col-span-2 py-4 bg-ui-lightText dark:bg-white text-white dark:text-black font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg transition-transform hover:translate-y-[-2px] active:translate-y-0"
        >
          View Profile
        </button>
        <button 
          onClick={() => onEdit(summary.employee)} 
          className="py-3 border border-ui-lightBorder dark:border-ui-darkBorder text-ui-lightText dark:text-ui-darkText font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-ui-lightBg dark:hover:bg-white/5 transition-colors"
        >
          Edit
        </button>
        <button 
          onClick={() => onDelete(summary.employee.id)} 
          className="py-3 border border-red-100 dark:border-red-900/30 text-red-500 font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-red 50 dark:hover:bg-red-950/20 transition-colors"
        >
          Delete
        </button>
      </div>
    </Card>
  );
};

export default EmployeeCard;
