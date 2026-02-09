
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import DashboardOverview from './components/dashboard/DashboardOverview';
import EmployeeDetail from './components/employee/EmployeeDetail';
import ClientManagement from './pages/ClientManagement';
import CampaignManagement from './pages/CampaignManagement';
import ReportsPage from './pages/ReportsPage';
import LoginPage from './pages/LoginPage';
import RegulationsPage from './pages/RegulationsPage';
import CataloguesPage from './pages/CataloguesPage';
import EmployeeReportsPage from './pages/EmployeeReportsPage'; 
import PlansPage from './pages/PlansPage'; 
import TaskBoardPage from './pages/TaskBoardPage'; 
import ManagerTasksPage from './pages/ManagerTasksPage'; 
import ActiveCampaignsPage from './pages/ActiveCampaignsPage'; 
import PasswordVaultPage from './pages/PasswordVaultPage'; // New Import
import { AuthService } from './services/authService';
import { UserSession } from './types';
import LoadingSpinner from './components/common/LoadingSpinner';
import { supabase } from './supabaseClient'; 
import { SYSTEM_SECTIONS } from './constants'; 
import FloatingNotes from './components/common/FloatingNotes'; 

const App: React.FC = () => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  
  const [notification, setNotification] = useState<{message: string, visible: boolean} | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const checkSession = async () => {
    setLoading(true);
    try {
      const currentSession = await AuthService.getCurrentSession();
      setSession(currentSession);
    } catch (err) {
      console.error("Auth check failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (!session || !session.employeeId) return;

    const channel = supabase.channel('global-task-notifications')
      .on(
        'postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'tasks' }, 
        (payload) => {
          const newRec = payload.new as any;
          const oldRec = payload.old as any;
          
          if (newRec.assigned_to === session.employeeId && oldRec.assigned_to !== session.employeeId) {
             setNotification({
                 message: `📬 وصلتك مهمة جديدة: ${newRec.title}`,
                 visible: true
             });
             
             setTimeout(() => setNotification(null), 5000);
             
             try {
                 const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                 audio.play();
             } catch(e) {}
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-ui-lightBg dark:bg-ui-darkBg transition-colors duration-500">
        <LoadingSpinner />
        <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-ui-lightText/30 dark:text-ui-darkText/30 animate-pulse">
          Elite Academy International | Core System
        </p>
      </div>
    );
  }

  if (!session) {
    return <LoginPage onLoginSuccess={checkSession} />;
  }

  const HomeRoute = () => {
      if (session.isAdmin) return <DashboardOverview />;
      
      if (!session.employeeId) {
          return (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <span className="text-4xl mb-4">⚠️</span>
                  <h2 className="text-xl font-bold text-gray-700 dark:text-white">حساب غير مرتبط</h2>
                  <p className="text-gray-500 mt-2">يرجى التواصل مع الإدارة لربط بريدك الإلكتروني بملف موظف.</p>
              </div>
          );
      }

      if (session.navPermissions?.['my_profile']) {
          return <EmployeeDetail isPortalView={true} overrideId={session.employeeId} />;
      }

      const firstAllowed = SYSTEM_SECTIONS.find(s => !s.adminOnly && s.key !== 'my_profile' && session.navPermissions?.[s.key]);
      
      if (firstAllowed) {
          return <Navigate to={firstAllowed.path} replace />;
      }

      return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <span className="text-4xl mb-4">🔒</span>
              <h2 className="text-xl font-bold text-gray-700 dark:text-white">مرحباً بك في النظام</h2>
              <p className="text-gray-500 mt-2">يرجى اختيار قسم من القائمة الجانبية.</p>
          </div>
      );
  };

  return (
    <div className="flex min-h-screen bg-ui-lightBg dark:bg-ui-darkBg transition-colors duration-500 relative">
      <FloatingNotes />
      {notification && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 border border-gray-700">
              <span className="text-2xl">🔔</span>
              <div>
                  <p className="font-bold text-sm">تنبيه مهام</p>
                  <p className="text-sm">{notification.message}</p>
              </div>
              <button onClick={() => setNotification(null)} className="mr-4 text-gray-400 hover:text-white">✕</button>
          </div>
      )}

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden glass"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar 
        isAdmin={session.isAdmin} 
        isSalesManager={session.isSalesManager}
        employeeId={session.employeeId} 
        canViewPlans={session.canViewPlans} 
        isDarkMode={isDarkMode} 
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          userEmail={session.email} 
          onLogout={async () => {
            await AuthService.logout();
            setSession(null);
            navigate('/');
          }}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-x-hidden">
          <Routes>
            <Route path="/" element={<HomeRoute />} />
            {session.isAdmin && (
                <>
                    <Route path="/employee/:id" element={<EmployeeDetail />} />
                </>
            )}
            <Route path="/vault" element={<PasswordVaultPage />} />
            <Route path="/manager-tasks" element={<ManagerTasksPage />} />
            <Route path="/active-campaigns" element={<ActiveCampaignsPage />} />
            <Route path="/clients" element={<ClientManagement />} />
            <Route path="/campaigns" element={<CampaignManagement />} />
            <Route path="/catalogues" element={<CataloguesPage />} />
            <Route path="/regulations" element={<RegulationsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/my-reports" element={<EmployeeReportsPage />} />
            <Route path="/tasks" element={<TaskBoardPage />} />
            <Route path="/plans" element={<PlansPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;
