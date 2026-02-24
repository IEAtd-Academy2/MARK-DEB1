
export enum Role {
  MarketingManager = 'Marketing Manager',
  OperationsSpecialist = 'Operations Specialist',
  DataAnalyst = 'Data Analyst',
  ContentCreator = 'Content Creator',
  CustomerService = 'Customer Service',
  Designer = 'Designer',
  VideoEditor = 'Video Editor',
  SalesSpecialist = 'Sales Specialist',
  SalesManager = 'Sales Manager',
  Owner = 'Owner'
}

export enum Department {
  Marketing = 'Marketing',
  Operations = 'Operations',
  HR = 'HR',
  Finance = 'Finance',
  CS = 'Customer Service',
  Certificates = 'Certificates',
  Sales = 'Sales',
}

export enum TaskStatus {
  Pending = 'Pending',
  Done = 'Done',
}

export enum MoodRating {
  Angry = 'Angry',
  Distracted = 'Distracted',
  Focused = 'Focused',
  Neutral = 'Neutral',
  Happy = 'Happy',
}

export enum SolutionStatus {
  Solved = 'Solved',
  Unsolved = 'Unsolved',
}

export enum LeaveType {
  Casual = 'Casual',
  SickShort = 'SickShort',
  SickLong = 'SickLong',
  Annual = 'Annual',
  Exceptional = 'Exceptional',
  Absence = 'Absence',
  Permission = 'Permission',
}

export enum LeaveStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
}

export enum KpiStatus {
  Draft = 'Draft',
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected'
}

export enum AttendanceStatus {
  Present = 'Present',
  Absent = 'Absent',
  WFH = 'WFH',
  Leave = 'Leave',
  Permission = 'Permission'
}

export type ColumnPermission = 'edit' | 'view' | 'hidden';

export interface Employee {
  id: string;
  user_id?: string;
  email: string;
  name: string;
  base_salary: number;
  role: Role;
  department: Department;
  is_sales_specialist?: boolean;
  sales_commission_rate?: number;
  monthly_sales_target?: number;
  other_commission_rate?: number;
  personal_catalog_url?: string;
  leave_balance: number; 
  can_view_plans?: boolean;
  plan_permissions?: Record<string, 'view' | 'edit'>;
  column_permissions?: Record<string, ColumnPermission>;
  default_incentive?: number;
  nav_permissions?: Record<string, boolean>;
  vault_permissions?: Record<string, 'view' | 'edit'>; // New: Vault category permissions
}

export interface PasswordCategory {
    id: string;
    name: string;
    icon: string;
    color: string;
}

export interface VaultPassword {
    id: string;
    category_id: string;
    title: string;
    username?: string;
    password?: string;
    url?: string;
    notes?: string;
    created_at?: string;
}

export interface SiteConfig {
  key: string;
  value: string;
}

export interface UserSession {
  user_id: string;
  email: string;
  isAdmin: boolean;
  isSalesManager?: boolean;
  employeeId?: string;
  canViewPlans?: boolean; 
  planPermissions?: Record<string, 'view' | 'edit'>;
  navPermissions?: Record<string, boolean>;
  vaultPermissions?: Record<string, 'view' | 'edit'>; // New
}

export interface KPIConfig { 
  id: string; 
  employee_id: string; 
  kpi_name: string; 
  target_value: number; 
  incentive_percentage?: number;
  unit_value?: number;
  smart_s?: string; 
  smart_m?: string; 
  smart_a?: string; 
  smart_r?: string; 
  smart_t?: string; 
  applicable_month?: number;
  applicable_year?: number;
  status?: KpiStatus; 
  manager_feedback?: string; 
}

export interface KPIRecord { 
  id: string; 
  employee_id: string; 
  kpi_config_id: string; 
  week_number: number; 
  month: number; 
  year: number; 
  achieved_value: number; 
  submission_date: Date; 
}

export interface TaskColumn {
    id: string;
    title: string;
    order_index: number;
}

export interface Task { 
    id: string; 
    title: string; 
    description?: string; 
    assigned_to: string; 
    source_dept: Department; 
    deadline: Date; 
    status: TaskStatus; 
    completion_date?: Date; 
    is_problem_solving: boolean;
    column_id?: string;
    order_index?: number;
    timer_start?: string;
    total_duration?: number;
    is_running?: boolean;
    attachment_url?: string;
    notes?: string;
}

export interface TaskLog {
    id: string;
    task_id: string;
    employee_id: string;
    task_title: string;
    duration_seconds: number;
    completed_at: Date;
    month: number;
    year: number;
}

export interface BehaviorLog { id: string; employee_id: string; week_number: number; month: number; year: number; mood_rating: MoodRating | number; notes?: string; }
export interface ProblemLog { id: string; employee_id: string; problem_desc: string; solution_status: SolutionStatus; guidance_given: boolean; logged_date: Date; solved_date?: Date; potential_bonus_amount: number; }
export interface Financials { 
  id: string; 
  employee_id: string; 
  month: number; 
  year: number; 
  calculated_incentive: number; 
  manual_deduction: number; 
  manual_deduction_note?: string; 
  problem_solving_bonus: number; 
  sales_commission_payout: number; 
  other_commission_payout: number; 
  final_payout: number; 
  base_salary_at_month: number; 
  kpi_score_percentage: number; 
  manager_feedback?: string; 
  commitment_score?: number;
  is_needs_improvement?: boolean;
  improvement_note?: string;
  recommendations?: string;
  report_notes?: string;
}
export interface Campaign { id: string; name: string; expenses: number; month: number; year: number; created_at?: string; }

export interface Client { 
    id: string; 
    name: string; 
    contact_info: string; 
    source_department: Department; 
    acquired_by_employee_id?: string | null;
    acquisition_source?: string;
    acquisition_date: Date; 
    initial_revenue: number; 
    notes?: string; 
}

export interface OtherCommissionLog { id: string; employee_id: string; month: number; year: number; amount: number; description: string; logged_date: Date; }

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: LeaveType;
  start_date: string; 
  end_date: string; 
  days_count: number;
  hours_count?: number;
  reason: string;
  attachment_url?: string;
  can_work_remotely?: boolean; 
  status: LeaveStatus;
  manager_comment?: string;
  created_at: string;
}

export interface AttendanceLog {
    id: string;
    employee_id: string;
    date: string;
    status: AttendanceStatus;
}

export interface EmployeeSummary { 
  employee: Employee; 
  kpiSummaries: { name: string; progress: number }[]; 
  totalKpiProgress: number; 
  onTimeRate: number; 
  currentExpectedPayout: number; 
  moodAlerts: string[]; 
  totalSalesRevenue?: number; 
  salesTargetProgress?: number;
  kpiPlanStatus?: KpiStatus;
  todaysAttendance?: AttendanceStatus;
}

export interface EmployeeKPIData { 
  week: number; 
  kpi_name: string;
  achieved: number; 
  target: number; 
  progress: number; 
}

export interface EmployeeTaskDisplay extends Task { isLate: boolean; }
export interface BehaviorChartData { week: number; moodValue: number; moodText: string; }
export interface PayrollBreakdown { 
  baseSalary: number; 
  kpiIncentive: number; 
  problemBonus: number; 
  salesCommission: number; 
  otherCommission: number; 
  manualDeduction: number;
  manualDeductionNote?: string; 
  finalPayout: number; 
  kpiScorePercentage: number; 
  totalSalesRevenue: number; 
  managerFeedback?: string; 
  commitmentScore?: number;
  isNeedsImprovement?: boolean;
  improvementNote?: string;
  recommendations?: string;
  reportNotes?: string;
}

export interface AIAnalysisResult {
  employeeName: string;
  classification: 'Leader Material' | 'Needs Improvement' | 'Plan C (Risk)' | 'Steady Performer';
  strengths: string[];
  weaknesses: string[];
  suggestedCourses: string[];
  managerNotes: string;
}

export interface PlanSheet {
    id?: string;
    title: string;
    sheet_name: string;
    data: any[];
    links?: {
        content_plan?: string;
        marketing_plan?: string;
        media_plan?: string;
    };
}

export interface PlanRow {
    goal: string;
    platforms: {
        snap_tiktok: string;
        insta_linkedin: string;
        youtube: string;
        fb_wa: string;
    };
    paid: {
        insta: string;
        fb: string;
        tiktok: string;
        youtube: string;
        google: string;
    };
}

export interface AgendaRow {
    date: string;
    time: string;
    content_type: string; 
    post_category: string; 
    title: string;
    post_type: string; 
    platforms: string[]; 
    content: string;
    url: string;
    status: {
        task_creation: boolean;
        media_product: boolean;
        scheduling: boolean;
    };
    metrics: {
        reach: string;
        engagement: string;
        views: string;
    };
}

export interface ContentDistributionRow {
    platform: string; 
    contentType: 'Awareness' | 'Positioning' | 'sales' | 'post-sales';
    distribution: string; 
    videoCount: number;
    designCount: number;
}

export interface EventsAgendaRow {
    occasion: string;
    date_gregorian: string;
    date_hijri: string;
    content_type: string;
    deadline: string;
}

export interface KeywordsRow {
    keyword: string;
    avg_monthly_searches: string;
    competition: 'high' | 'medium' | 'low';
    account_status: 'in' | 'out';
    yoy_change: string;
}

export interface AnalysisRowOrganic {
    platform: string;
    reach: string;
    impressions: string;
    interactions: string;
    shares: string;
    comments: string;
    video_views: string;
    post_clicks: string;
}

export interface AnalysisRowPaid {
    platform: string;
    reach: string;
    impressions: string;
    clicks: string;
    results: string;
    cpc: string;
    cpr: string;
    cpm: string;
}

export interface AnalysisQuarter {
    quarter_name: string;
    organic_data: AnalysisRowOrganic[];
    paid_data: AnalysisRowPaid[];
}

export type ManagerTaskStatus = 'pending' | 'in_progress' | 'completed' | 'incomplete';

export interface ManagerTask {
    id: string;
    title: string;
    time_slot: string;
    status: ManagerTaskStatus;
    notes?: string;
    date: string;
    is_custom: boolean;
}

export interface AdCampaign {
    id: string;
    name: string;
    destination_number: string;
    link: string;
    targeting: string;
    is_active: boolean;
    created_at?: string;
}
