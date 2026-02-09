
import React, { useState } from 'react';
import Card from '../common/Card';
import { PayrollBreakdown } from '../../types';
import Button from '../common/Button';
import ManagerFeedbackForm from '../forms/ManagerFeedbackForm';
import { DataService } from '../../services/dataService';

interface EmployeeFinancialsCardProps {
  employeeId: string;
  payrollBreakdown: PayrollBreakdown;
  onAddDeduction: () => void;
  onDeleteDeduction: () => void;
  onAddOtherCommission: () => void;
  onResetFinancials?: () => void;
  isSalesSpecialist: boolean;
  isReadOnly?: boolean;
  canViewDetails?: boolean; 
  releaseDate?: Date; 
  targetPotentialIncentive?: number;
}

const EmployeeFinancialsCard: React.FC<EmployeeFinancialsCardProps> = ({ 
  employeeId, 
  payrollBreakdown, 
  onAddDeduction, 
  onDeleteDeduction, 
  onAddOtherCommission, 
  onResetFinancials,
  isSalesSpecialist,
  isReadOnly = false,
  canViewDetails = true, 
  releaseDate,
  targetPotentialIncentive = 0
}) => {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const totalIncentives = (payrollBreakdown.kpiIncentive || 0) + 
                         (payrollBreakdown.problemBonus || 0) + 
                         (payrollBreakdown.salesCommission || 0) + 
                         (payrollBreakdown.otherCommission || 0);

  // Determine if sensitive info should be hidden (For Employee Portal only)
  const shouldHideSensitiveInfo = isReadOnly && !canViewDetails;

  return (
    <>
      <Card className="border-r-4 border-indigo-600 dark:border-indigo-400">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-ui-lightText dark:text-ui-darkText">💰 الموقف المالي الحالي</h3>
          {!isReadOnly && (
            <div className="flex gap-2">
              <button onClick={() => setShowFeedbackForm(true)} className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 transition-colors">
                📝 نصائح الشهر
              </button>
              <button onClick={onAddOtherCommission} className="text-[10px] font-bold px-3 py-1.5 rounded-lg border border-ui-lightBorder dark:border-ui-darkBorder hover:bg-ui-lightBg dark:hover:bg-ui-darkBg transition-colors">
                + عمولة
              </button>
              <button onClick={onAddDeduction} className="text-[10px] font-bold px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                +/- خصم
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-ui-lightMuted dark:text-ui-darkMuted font-medium">الراتب الأساسي</span>
            <span className="font-bold">{payrollBreakdown.baseSalary.toLocaleString()} ج.م</span>
          </div>

          {/* Potential/Target Indicator - Visible if not hidden or for manager */}
          {targetPotentialIncentive > 0 && !shouldHideSensitiveInfo && (
             <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-xl border border-dashed border-gray-200 dark:border-white/10 flex justify-between items-center">
                 <span className="text-[10px] font-bold text-gray-500">الحوافز المستهدفة (100%):</span>
                 <span className="text-xs font-black text-indigo-500">{targetPotentialIncentive.toLocaleString()} ج.م</span>
             </div>
          )}

          {/* Incentives Section */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800/30">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">إجمالي الحوافز المكتسبة</span>
              {shouldHideSensitiveInfo ? (
                  <span className="text-xs font-bold text-indigo-400 italic">قيد المراجعة...</span>
              ) : (
                  <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">+{totalIncentives.toLocaleString()} <span className="text-[10px]">ج.م</span></span>
              )}
            </div>
            
            {!shouldHideSensitiveInfo && (
                <div className="space-y-1 pt-2 border-t border-indigo-100 dark:border-indigo-800/30 opacity-80">
                    <div className="flex justify-between text-[10px]">
                        <span>حافز الأداء (KPIs):</span>
                        <span className="font-bold">{payrollBreakdown.kpiIncentive.toLocaleString()}</span>
                    </div>
                    {isSalesSpecialist && (
                        <div className="flex justify-between text-[10px]">
                            <span>عمولة المبيعات:</span>
                            <span className="font-bold">{payrollBreakdown.salesCommission.toLocaleString()}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-[10px]">
                        <span>مكافآت حل المشاكل:</span>
                        <span className="font-bold">{payrollBreakdown.problemBonus.toLocaleString()}</span>
                    </div>
                    {payrollBreakdown.otherCommission > 0 && (
                        <div className="flex justify-between text-[10px]">
                            <span>إضافات وعمولات أخرى:</span>
                            <span className="font-bold">{payrollBreakdown.otherCommission.toLocaleString()}</span>
                        </div>
                    )}
                </div>
            )}
          </div>

          {/* Deductions Section */}
          {!shouldHideSensitiveInfo ? (
            <>
              {payrollBreakdown.manualDeduction > 0 && (
                <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-100 dark:border-red-900/20">
                  <div className="flex justify-between items-center text-xs text-red-500 font-bold px-1">
                    <span>إجمالي الخصومات</span>
                    <span>-{payrollBreakdown.manualDeduction.toLocaleString()} ج.م</span>
                  </div>
                  {payrollBreakdown.manualDeductionNote && (
                    <p className="text-[10px] text-red-400 mt-1 pr-1 font-medium border-t border-red-200 dark:border-red-800/30 pt-1">
                      السبب: {payrollBreakdown.manualDeductionNote}
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
             <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-white/10 text-center">
                <p className="text-[10px] text-gray-400">تظهر الخصومات والاعتمادات النهائية بحلول يوم 7 من الشهر القادم.</p>
             </div>
          )}

          {payrollBreakdown.managerFeedback && (
             <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-100 dark:border-amber-800/30">
                <p className="text-[9px] font-black text-amber-600 uppercase mb-1">💡 ملاحظات المدير</p>
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                   "{payrollBreakdown.managerFeedback}"
                </p>
             </div>
          )}

          {/* Final Estimated Net Payout Block */}
          <div className="pt-2 space-y-3">
            <div className="bg-ui-lightText dark:bg-white text-ui-lightCard dark:text-black p-4 rounded-2xl flex justify-between items-center shadow-lg transform hover:scale-[1.02] transition-all">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold opacity-70 uppercase tracking-wider">الصافي التقديري</span>
                <span className="text-[8px] opacity-50 font-bold">قابل للتغيير حتى موعد الإغلاق</span>
              </div>
              <span className="text-2xl font-black">
                  {shouldHideSensitiveInfo ? (
                      <span className="text-sm font-bold opacity-60">قيد التحديث...</span>
                  ) : (
                      <>
                        {(payrollBreakdown.baseSalary + totalIncentives - payrollBreakdown.manualDeduction).toLocaleString()} <span className="text-xs">ج.م</span>
                      </>
                  )}
              </span>
            </div>
            
            {shouldHideSensitiveInfo && (
                <p className="text-[9px] text-center text-gray-400 font-bold px-2">
                    ⚠️ الحسابات تصبح نهائية وتظهر للموظف يوم {releaseDate?.toLocaleDateString('ar-EG', {day: 'numeric', month: 'long'})}
                </p>
            )}

            {!isReadOnly && onResetFinancials && (
              <button 
                onClick={onResetFinancials}
                className="w-full text-[10px] text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 py-2 rounded-xl transition-all"
              >
                ⚠️ تصفير الدفتر المالي الحالي
              </button>
            )}
          </div>
        </div>
      </Card>

      {showFeedbackForm && (
        <ManagerFeedbackForm
          currentFeedback={payrollBreakdown.managerFeedback || ''}
          month={currentMonth}
          year={currentYear}
          onClose={() => setShowFeedbackForm(false)}
          onSubmit={async (text) => {
             await DataService.updateManagerFeedback(employeeId, currentMonth, currentYear, text);
             window.location.reload(); 
          }}
          isModal={true}
        />
      )}
    </>
  );
};

export default EmployeeFinancialsCard;
