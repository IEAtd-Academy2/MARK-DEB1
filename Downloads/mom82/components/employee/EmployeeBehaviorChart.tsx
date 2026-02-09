
import React from 'react';
import Card from '../common/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MoodRating, BehaviorLog, BehaviorChartData } from '../../types';
import Button from '../common/Button';
import { MOOD_RATING_MAP, MOOD_RATING_AR_MAP } from '../../constants';

interface EmployeeBehaviorChartProps {
  employeeId: string;
  allBehaviorLogs: BehaviorLog[]; // Data passed as prop
  behaviorChartData: BehaviorChartData[]; // Chart data passed as prop
  moodAlerts: string[]; // Alerts passed as prop
  onAddBehaviorLog: () => void;
  onEditBehaviorLog: (log: BehaviorLog) => void;
  onDeleteBehaviorLog: (logId: string) => void;
  // Fix: Added isReadOnly prop
  isReadOnly?: boolean;
}

const EmployeeBehaviorChart: React.FC<EmployeeBehaviorChartProps> = ({
  employeeId,
  allBehaviorLogs,
  behaviorChartData,
  moodAlerts,
  onAddBehaviorLog,
  onEditBehaviorLog,
  onDeleteBehaviorLog,
  isReadOnly = false
}) => {
  const formatMoodTick = (tickItem: number) => {
    const moodEntry = Object.entries(MOOD_RATING_MAP).find(([key, value]) => value === tickItem);
    return moodEntry ? MOOD_RATING_AR_MAP[moodEntry[0] as MoodRating] : '';
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-700">تتبع السلوك والمزاج</h3>
        {/* Fix: Conditionally render management actions */}
        {!isReadOnly && (
          <Button onClick={onAddBehaviorLog} size="sm">تسجيل سلوك</Button>
        )}
      </div>
      {moodAlerts.length > 0 && (
        <div className="mb-4 p-2 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 text-sm rounded-md">
          <h4 className="font-semibold mb-1">تنبيهات:</h4>
          <ul className="list-disc list-inside space-y-0.5 pr-4">
            {moodAlerts.map((alert, index) => (
              <li key={index}>{alert}</li>
            ))}
          </ul>
        </div>
      )}
      {behaviorChartData.length === 0 ? (
        <p className="text-gray-600 text-center py-4">لا توجد بيانات سلوك متاحة لهذا الموظف.</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300}>
            {/* Fix: Removed invalid 'dir' prop from LineChart */}
            <LineChart
              data={behaviorChartData}
              margin={{
                top: 5,
                right: 20,
                left: 10,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="week" label={{ value: 'رقم الأسبوع', position: 'insideBottom', offset: 0 }} />
              <YAxis
                domain={[1, 10]}
                tickFormatter={formatMoodTick}
                label={{ value: 'تقييم المزاج', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                formatter={(value: number, name: string, props) => [MOOD_RATING_AR_MAP[props.payload.moodText as MoodRating] || value, 'المزاج']}
                labelFormatter={(label) => `الأسبوع ${label}`}
              />
              <Line
                type="monotone"
                dataKey="moodValue"
                stroke="#8884d8"
                strokeWidth={2}
                activeDot={{ r: 8 }}
                name="المزاج"
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-6">
            <h4 className="text-lg font-medium text-gray-700 mb-3">سجلات السلوك</h4>
            {allBehaviorLogs.length === 0 ? (
              <p className="text-gray-600 text-center py-4">لا توجد سجلات سلوك.</p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {allBehaviorLogs.map(log => (
                  <div key={log.id} className="p-3 border rounded-lg bg-gray-50 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800">الأسبوع: {log.week_number}</p>
                      <p className="text-sm text-gray-600">المزاج: {typeof log.mood_rating === 'number' ? log.mood_rating : MOOD_RATING_AR_MAP[log.mood_rating]}</p>
                      {log.notes && <p className="text-xs text-gray-500">ملاحظات: {log.notes}</p>}
                    </div>
                    {/* Fix: Conditionally render management actions */}
                    {!isReadOnly && (
                      <div className="flex space-x-2 rtl:space-x-reverse">
                        <Button onClick={() => onEditBehaviorLog(log)} variant="secondary" size="sm">تعديل</Button>
                        <Button onClick={() => onDeleteBehaviorLog(log.id)} variant="danger" size="sm">حذف</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
};

export default EmployeeBehaviorChart;
