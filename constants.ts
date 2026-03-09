
import { MoodRating, Department, Role, TaskStatus, SolutionStatus, AttendanceStatus, KpiStatus, LeaveType } from './types';

export const COMPANY_NAME = "أكاديمية النخبة الدولية للتدريب والتنمية ieatd";
export const DEPT_NAME = "قسم التسويق والعمليات";
export const DEPT_NAME_EN = "Marketing & Operations Dept";

export const DEFAULT_KPI_TARGET = 100;
export const DEFAULT_INCENTIVE_PERCENTAGE = 0.20;

export const MOOD_RATING_MAP: Record<MoodRating, number> = {
  [MoodRating.Angry]: 1,
  [MoodRating.Distracted]: 3,
  [MoodRating.Neutral]: 5,
  [MoodRating.Focused]: 8,
  [MoodRating.Happy]: 10,
};

export const MIN_MOOD_RATING_FOR_LOW_FOCUS = 3;
export const MAX_MOOD_RATING_FOR_HIGH_ANGER = 2;

export const SYSTEM_SECTIONS = [
    { key: 'dashboard', label: 'لوحة القيادة (Admin)', path: '/', icon: '📊', adminOnly: true },
    { key: 'my_profile', label: 'ملفي الشخصي (Home)', path: '/', icon: '🏠', employeeOnly: true },
    { key: 'vault', label: 'خزنة الحسابات', path: '/vault', icon: '🔐' }, // New Vault Section
    { key: 'manager_tasks', label: 'مهام المدير', path: '/manager-tasks', icon: '📝' },
    { key: 'campaign_reports', label: 'تقارير الحملات', path: '/campaign-reports', icon: '📢' },
    { key: 'clients', label: 'العملاء', path: '/clients', icon: '👥' },
    { key: 'campaigns', label: 'مصاريف الحملات', path: '/campaigns', icon: '📢' },
    { key: 'catalogues', label: 'الكتالوجات', path: '/catalogues', icon: '📚' },
    { key: 'regulations', label: 'اللائحة الإدارية', path: '/regulations', icon: '⚖️' },
    { key: 'reports', label: 'التقارير (General)', path: '/reports', icon: '📈' },
    { key: 'my_reports', label: 'تقاريري', path: '/my-reports', icon: '📈' },
    { key: 'tasks', label: 'لوحة المهام', path: '/tasks', icon: '📋' },
    { key: 'plans', label: 'الخطط والعمليات', path: '/plans', icon: '📅' },
];

export const NAV_ITEMS = [
  { name: 'لوحة القيادة', href: '/', icon: '📊' },
  { name: 'خزنة الحسابات', href: '/vault', icon: '🔐' },
  { name: 'مهام المدير', href: '/manager-tasks', icon: '📝' },
  { name: 'تقارير الحملات', href: '/campaign-reports', icon: '📢' },
  { name: 'العملاء', href: '/clients', icon: '👥' },
  { name: 'مصاريف الحملات', href: '/campaigns', icon: '📢' },
  { name: 'الكتالوجات', href: '/catalogues', icon: '📚' },
  { name: 'اللائحة الإدارية', href: '/regulations', icon: '⚖️' },
  { name: 'التقارير', href: '/reports', icon: '📈' },
];

export const DEPARTMENT_AR_MAP: Record<Department, string> = {
  [Department.Marketing]: 'التسويق',
  [Department.Operations]: 'العمليات',
  [Department.HR]: 'الموارد البشرية',
  [Department.Finance]: 'المالية',
  [Department.CS]: 'خدمة العملاء',
  [Department.Certificates]: 'الشهادات',
  [Department.Sales]: 'المبيعات',
};

export const ROLE_AR_MAP: Record<Role, string> = {
  [Role.MarketingManager]: 'مدير تسويق',
  [Role.OperationsSpecialist]: 'أخصائي عمليات',
  [Role.DataAnalyst]: 'محلل بيانات',
  [Role.ContentCreator]: 'منشئ محتوى',
  [Role.CustomerService]: 'خدمة عملاء',
  [Role.Designer]: 'مصمم',
  [Role.VideoEditor]: 'محرر فيديو',
  [Role.SalesSpecialist]: 'أخصائي مبيعات',
  [Role.SalesManager]: 'مدير مبيعات',
  [Role.Owner]: 'المالك',
};

export const MOOD_RATING_AR_MAP: Record<MoodRating, string> = {
  [MoodRating.Angry]: 'غاضب',
  [MoodRating.Distracted]: 'مشتت',
  [MoodRating.Focused]: 'مركز',
  [MoodRating.Neutral]: 'محايد',
  [MoodRating.Happy]: 'سعيد',
};

export const TASK_STATUS_AR_MAP: Record<TaskStatus, string> = {
  [TaskStatus.Pending]: 'معلق',
  [TaskStatus.Done]: 'تم الإنجاز',
};

export const SOLUTION_STATUS_AR_MAP: Record<SolutionStatus, string> = {
  [SolutionStatus.Solved]: 'تم الحل',
  [SolutionStatus.Unsolved]: 'لم يتم الحل',
};

export const ATTENDANCE_STATUS_AR_MAP: Record<AttendanceStatus, string> = {
  [AttendanceStatus.Present]: 'حاضر',
  [AttendanceStatus.Absent]: 'غائب',
  [AttendanceStatus.WFH]: 'عمل من المنزل',
  [AttendanceStatus.Leave]: 'إجازة',
  [AttendanceStatus.Permission]: 'إذن',
};

export const KPI_STATUS_AR_MAP: Record<KpiStatus, string> = {
  [KpiStatus.Draft]: 'مسودة',
  [KpiStatus.Pending]: 'قيد المراجعة',
  [KpiStatus.Approved]: 'معتمد',
  [KpiStatus.Rejected]: 'مرفوض/للتعديل',
};

export const PLAN_SHEET_TABS = [
    { id: 'plan', label: 'Plan', color: 'border-b-4 border-blue-600 text-blue-700' },
    { id: 'awareness', label: 'Awareness', color: 'border-b-4 border-teal-500 text-teal-600' },
    { id: 'positioning', label: 'Positioning', color: 'border-b-4 border-purple-500 text-purple-600' },
    { id: 'sales', label: 'Sales', color: 'border-b-4 border-green-500 text-green-600' },
    { id: 'post_sales', label: 'Post-Sales', color: 'border-b-4 border-orange-500 text-orange-600' },
    { id: 'agenda', label: 'Agenda', color: 'border-b-4 border-red-800 text-red-900 font-black' },
    { id: 'content_distribution', label: 'Content Dist.', color: 'border-b-4 border-gray-700 text-gray-800 font-black' }, 
    { id: 'events_agenda', label: 'Events agenda', color: 'border-b-4 border-indigo-700 text-indigo-800 font-black' }, 
    { id: 'keywords', label: 'keywords', color: 'border-b-4 border-blue-800 text-blue-900 font-black' }, 
    { id: 'analysis', label: 'analysis', color: 'border-b-4 border-blue-600 text-blue-700 font-black' }
];

export const DEFAULT_MANAGER_SCHEDULE = [
    { time: '09:00 - 10:00', title: 'البداية التقنية والمتابعة السريعة (برمجة، ايميلات، مراجعة الاعلانات)' },
    { time: '10:00 - 11:30', title: 'إدارة العمليات والموظفين (توزيع مهام، حوافز، حل مشكلات)' },
    { time: '11:30 - 12:30', title: 'وقت التركيز: الإعلانات والتحليلات (Deep Work)' },
    { time: '12:30 - 01:00', title: 'استراحة (Break)' },
    { time: '01:00 - 02:00', title: 'مراقبة الجودة (QC) وتسليمات الفريلانسرز' },
    { time: '02:00 - 03:00', title: 'التواصل الاستراتيجي (الإدارة والاستشاري)' },
    { time: '03:00 - 04:00', title: 'وقت التعلم والتطوير (Learning)' },
    { time: '04:00 - 04:45', title: 'وقت الاستكشاف والابتكار (Trends & Tools)' },
    { time: '04:45 - 05:00', title: 'الإغلاق والتخطيط للغد (Wrap Up)' }
];
