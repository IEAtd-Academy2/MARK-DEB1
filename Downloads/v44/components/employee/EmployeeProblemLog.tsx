
import React from 'react';
import Card from '../common/Card';
import { ProblemLog, SolutionStatus } from '../../types';
import Button from '../common/Button';
import { SOLUTION_STATUS_AR_MAP } from '../../constants';
import { DataService } from '../../services/dataService'; // Keep for solvedProblemsCount

interface EmployeeProblemLogProps {
  employeeId: string;
  allProblemLogs: ProblemLog[]; // Data passed as prop
  onAddProblemLog: () => void;
  onUpdateProblemLog: () => void; // To refresh data after update
  onEditProblemLog: (log: ProblemLog) => void;
  onDeleteProblemLog: (logId: string) => void;
  // Fix: Added isReadOnly prop
  isReadOnly?: boolean;
}

const EmployeeProblemLog: React.FC<EmployeeProblemLogProps> = ({
  employeeId,
  allProblemLogs,
  onAddProblemLog,
  onUpdateProblemLog,
  onEditProblemLog,
  onDeleteProblemLog,
  isReadOnly = false
}) => {
  const handleUpdateLogStatus = async (log: ProblemLog, newStatus: SolutionStatus, guidanceGiven: boolean) => {
    try {
      const updatedLog = {
        ...log,
        solution_status: newStatus,
        guidance_given: guidanceGiven,
        solved_date: newStatus === SolutionStatus.Solved ? new Date() : undefined
      };
      await DataService.updateProblemLog(updatedLog);
      onUpdateProblemLog(); // Trigger parent refresh
    } catch (err) {
      console.error("فشل تحديث حالة سجل المشكلة:", err);
      // Optionally set an error state here to display in the component
    }
  };

  // Now sums up the potential bonus amounts
  const [totalProblemSolvingBonus, setTotalProblemSolvingBonus] = React.useState(0);

  React.useEffect(() => {
    const fetchBonus = async () => {
      try {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        const bonus = await DataService.getEmployeeProblemSolvingBonusTotal(employeeId, currentMonth, currentYear);
        setTotalProblemSolvingBonus(bonus);
      } catch (err) {
        console.error("فشل جلب إجمالي مكافآت حل المشاكل:", err);
        // Optionally set an error state
      }
    };
    fetchBonus();
  }, [employeeId, allProblemLogs]); // Re-fetch when logs change

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-700">حل المشاكل والإرشاد</h3>
        {/* Fix: Conditionally render management actions */}
        {!isReadOnly && (
          <Button onClick={onAddProblemLog} size="sm">تسجيل مشكلة جديدة</Button>
        )}
      </div>

      <p className="text-gray-600 mb-4">
        إجمالي مكافآت حل المشاكل المستحقة: <span className="font-semibold">{totalProblemSolvingBonus.toFixed(2)} جنيه مصري</span>
      </p>

      {allProblemLogs.length === 0 ? (
        <p className="text-gray-600 text-center py-4">لا توجد سجلات مشاكل لهذا الموظف.</p>
      ) : (
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {allProblemLogs.map(log => (
            <div key={log.id} className="p-3 border rounded-lg bg-gray-50">
              <p className="font-semibold text-gray-800 mb-1">{log.problem_desc}</p>
              <div className="flex items-center text-sm text-gray-600 space-x-4 rtl:space-x-reverse">
                <span>
                  الحالة:
                  <span className={`mr-1 font-medium ${log.solution_status === SolutionStatus.Solved ? 'text-green-600' : 'text-red-600'}`}>
                    {SOLUTION_STATUS_AR_MAP[log.solution_status]}
                  </span>
                </span>
                <span>
                  تم تقديم التوجيه:
                  <span className={`mr-1 font-medium ${log.guidance_given ? 'text-indigo-600' : 'text-gray-500'}`}>
                    {log.guidance_given ? 'نعم' : 'لا'}
                  </span>
                </span>
                {log.potential_bonus_amount > 0 && (
                  <span>
                    مكافأة محتملة: <span className="font-medium text-green-600">{log.potential_bonus_amount.toFixed(2)} جنيه مصري</span>
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  تاريخ التسجيل: {log.logged_date.toLocaleDateString()}
                  {log.solved_date && ` (تم الحل: ${log.solved_date.toLocaleDateString()})`}
                </span>
              </div>
              {/* Fix: Conditionally render management actions */}
              {!isReadOnly && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {log.solution_status === SolutionStatus.Unsolved && (
                    <Button
                      onClick={() => handleUpdateLogStatus(log, SolutionStatus.Solved, true)}
                      variant="primary"
                      size="sm"
                    >
                      تحديد كمحلولة (مع التوجيه)
                    </Button>
                  )}
                  {log.solution_status === SolutionStatus.Solved && (
                    <Button
                      onClick={() => handleUpdateLogStatus(log, SolutionStatus.Unsolved, false)}
                      variant="secondary"
                      size="sm"
                    >
                      تحديد كغير محلولة
                    </Button>
                  )}
                  <Button onClick={() => onEditProblemLog(log)} variant="secondary" size="sm">تعديل</Button>
                  <Button onClick={() => onDeleteProblemLog(log.id)} variant="danger" size="sm">حذف</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default EmployeeProblemLog;