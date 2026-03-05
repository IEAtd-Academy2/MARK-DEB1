
import { supabase } from '../supabaseClient';
import { UserSession, Role } from '../types';

export const AuthService = {
  async login(email: string, password: string): Promise<UserSession> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('فشل تسجيل الدخول.');

    return this.getUserSession(data.user);
  },

  async logout() {
    await supabase.auth.signOut();
  },

  async getCurrentSession(): Promise<UserSession | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    return this.getUserSession(session.user);
  },

  async getUserSession(user: any): Promise<UserSession> {
    // 1. التحقق من صلاحيات المدير
    const isAdmin = user.email === 'info@ieatd.com'; 

    // 2. البحث عن الموظف باستخدام user_id (الرابط المباشر) مع جلب كافة الحقول الهامة بما فيها الخزنة
    let { data: employee, error } = await supabase
      .from('employees')
      .select('id, email, user_id, role, can_view_plans, plan_permissions, nav_permissions, vault_permissions')
      .eq('user_id', user.id)
      .maybeSingle();

    // 3. إذا لم يوجد رابط (user_id)، نبحث عن الموظف باستخدام البريد الإلكتروني (الربط التلقائي)
    if (!employee && user.email) {
      const { data: employeeByEmail } = await supabase
        .from('employees')
        .select('id, email, user_id, role, can_view_plans, plan_permissions, nav_permissions, vault_permissions')
        .eq('email', user.email)
        .maybeSingle();

      if (employeeByEmail) {
        // إذا وجدناه بالإيميل، نقوم بتحديث الـ user_id في قاعدة البيانات فوراً للربط الدائم
        await supabase
          .from('employees')
          .update({ user_id: user.id })
          .eq('id', employeeByEmail.id);
        
        employee = employeeByEmail;
      }
    }

    // Check if Sales Manager (Robust Check)
    let isSalesManager = false;
    if (employee && employee.role) {
        const roleStr = employee.role.trim().toLowerCase();
        isSalesManager = roleStr === 'sales manager' || roleStr === 'salesmanager';
    }

    return {
      user_id: user.id,
      email: user.email!,
      isAdmin: isAdmin,
      isSalesManager: isSalesManager,
      employeeId: employee?.id,
      canViewPlans: isAdmin || employee?.can_view_plans,
      planPermissions: employee?.plan_permissions || {},
      navPermissions: employee?.nav_permissions || {},
      vaultPermissions: employee?.vault_permissions || {} // جلب صلاحيات الخزنة
    };
  }
};
