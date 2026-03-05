
import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { DataService } from '../services/dataService';
import { AuthService } from '../services/authService';
import { PlanSheet, PlanRow, AgendaRow, ContentDistributionRow, EventsAgendaRow, KeywordsRow, AnalysisQuarter } from '../types';
import MarketingPlanTable from '../components/plans/MarketingPlanTable';
import AgendaTable from '../components/plans/AgendaTable';
import ContentDistributionTable from '../components/plans/ContentDistributionTable';
import EventsAgendaTable from '../components/plans/EventsAgendaTable';
import KeywordsTable from '../components/plans/KeywordsTable';
import AnalysisTable from '../components/plans/AnalysisTable';
import { PLAN_SHEET_TABS } from '../constants';

const PlansPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const [currentPlan, setCurrentPlan] = useState<PlanSheet | null>(null);
  
  // Permissions
  const [isAdmin, setIsAdmin] = useState(false);
  const [visibleTabs, setVisibleTabs] = useState<typeof PLAN_SHEET_TABS>([]);
  const [canEditCurrentTab, setCanEditCurrentTab] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  
  // Link editing state
  const [editLinks, setEditLinks] = useState(false);
  const [links, setLinks] = useState({ content_plan: '', marketing_plan: '', media_plan: '' });

  useEffect(() => {
    const init = async () => {
        const session = await AuthService.getCurrentSession();
        const adminStatus = !!session?.isAdmin;
        setIsAdmin(adminStatus);

        // Calculate Permissions
        let allowedTabs = PLAN_SHEET_TABS;
        if (!adminStatus) {
            const permissions = session?.planPermissions || {};
            // Filter tabs based on 'view' or 'edit' permission presence
            allowedTabs = PLAN_SHEET_TABS.filter(t => permissions[t.id] === 'view' || permissions[t.id] === 'edit');
        }
        
        setVisibleTabs(allowedTabs);

        if (allowedTabs.length > 0) {
            const initialTab = allowedTabs[0].id;
            setActiveTab(initialTab);
            await fetchPlanData(initialTab, adminStatus, session?.planPermissions);
        } else {
            setLoading(false); // No tabs to show
        }
    };
    init();
  }, []);

  const fetchPlanData = async (sheetName: string, adminStatus: boolean, permissions?: Record<string, 'view' | 'edit'>) => {
    setLoading(true);
    
    // Determine edit permission for this specific tab
    if (adminStatus) {
        setCanEditCurrentTab(true);
    } else {
        const perm = permissions ? permissions[sheetName] : undefined;
        setCanEditCurrentTab(perm === 'edit');
    }

    try {
        const plan = await DataService.getPlan(sheetName);
        if (plan) {
            setCurrentPlan(plan);
            if (plan.links) {
                setLinks({
                    content_plan: plan.links.content_plan || '',
                    marketing_plan: plan.links.marketing_plan || '',
                    media_plan: plan.links.media_plan || ''
                });
            } else {
                setLinks({ content_plan: '', marketing_plan: '', media_plan: '' });
            }
        } else {
            // New empty plan structure
            setCurrentPlan({
                title: 'New Plan',
                sheet_name: sheetName,
                data: [], // Empty rows
                links: {}
            });
            setLinks({ content_plan: '', marketing_plan: '', media_plan: '' });
        }
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleTabChange = async (tabId: string) => {
      setActiveTab(tabId);
      setIsEditing(false); // Reset edit mode on tab switch
      const session = await AuthService.getCurrentSession();
      await fetchPlanData(tabId, !!session?.isAdmin, session?.planPermissions);
  };

  const handleSavePlan = async () => {
      if (!currentPlan) return;
      setLoading(true);
      try {
          await DataService.savePlan({
              ...currentPlan,
              sheet_name: activeTab, // Ensure we save to correct tab
              links: links // Save links
          });
          setIsEditing(false);
          setEditLinks(false);
      } catch (e: any) {
          alert('Failed to save: ' + e.message);
      } finally {
          setLoading(false);
      }
  };

  const updateTableData = (newData: any[]) => {
      if (currentPlan) {
          setCurrentPlan({ ...currentPlan, data: newData });
      }
  };

  const renderTable = () => {
      if (!currentPlan) return null;

      switch(activeTab) {
          case 'agenda':
              return (
                <AgendaTable 
                    data={currentPlan.data as AgendaRow[]}
                    isEditing={isEditing}
                    onDataChange={updateTableData}
                />
              );
          case 'content_distribution':
              return (
                  <ContentDistributionTable
                    data={currentPlan.data as ContentDistributionRow[]}
                    isEditing={isEditing}
                    onDataChange={updateTableData}
                  />
              );
          case 'events_agenda':
              return (
                  <EventsAgendaTable
                    data={currentPlan.data as EventsAgendaRow[]}
                    isEditing={isEditing}
                    onDataChange={updateTableData}
                  />
              );
          case 'keywords':
              return (
                  <KeywordsTable
                    data={currentPlan.data as KeywordsRow[]}
                    isEditing={isEditing}
                    onDataChange={updateTableData}
                  />
              );
          case 'analysis':
              return (
                  <AnalysisTable
                    data={currentPlan.data as AnalysisQuarter[]}
                    isEditing={isEditing}
                    onDataChange={updateTableData}
                  />
              );
          default:
              return (
                <MarketingPlanTable 
                    data={currentPlan.data as PlanRow[]} 
                    isEditing={isEditing} 
                    onDataChange={updateTableData} 
                />
              );
      }
  };

  if (visibleTabs.length === 0 && !loading) {
      return (
          <div className="flex flex-col items-center justify-center min-h-screen">
              <span className="text-6xl mb-4">🔒</span>
              <h2 className="text-2xl font-bold text-gray-700">عفواً، ليس لديك صلاحية لعرض أي خطط.</h2>
              <p className="text-gray-500">يرجى التواصل مع المدير لمنحك الصلاحيات اللازمة.</p>
          </div>
      );
  }

  return (
    <div className="space-y-6 pb-24 h-full min-h-screen relative animate-in fade-in slide-in-from-bottom-2">
      <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-brand-charcoal">📈 إدارة الخطط (Plans)</h2>
            <p className="text-gray-500 text-sm">استعرض وعدل خطط العمل</p>
          </div>
          {canEditCurrentTab && (
              <div className="flex gap-2">
                  {isEditing || editLinks ? (
                      <>
                        <Button onClick={() => { setIsEditing(false); setEditLinks(false); }} variant="secondary">إلغاء</Button>
                        <Button onClick={handleSavePlan} className="bg-green-600 text-white shadow-lg animate-pulse hover:animate-none">حفظ التغييرات</Button>
                      </>
                  ) : (
                      <>
                        <Button onClick={() => setEditLinks(true)} variant="outline" className="text-xs">تعديل الروابط</Button>
                        <Button onClick={() => setIsEditing(true)} variant="primary">تعديل الجدول</Button>
                      </>
                  )}
              </div>
          )}
      </div>

      {/* Top Links Section */}
      <Card className="bg-gradient-to-r from-gray-50 to-white border-b-4 border-gray-200">
          {editLinks ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4" dir="rtl">
                  <input placeholder="رابط خطة المحتوى" value={links.content_plan} onChange={(e) => setLinks({...links, content_plan: e.target.value})} className="p-2 border rounded text-sm" />
                  <input placeholder="رابط خطة التسويق" value={links.marketing_plan} onChange={(e) => setLinks({...links, marketing_plan: e.target.value})} className="p-2 border rounded text-sm" />
                  <input placeholder="رابط خطة الميديا" value={links.media_plan} onChange={(e) => setLinks({...links, media_plan: e.target.value})} className="p-2 border rounded text-sm" />
              </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-6">
                <a href={links.content_plan || '#'} target="_blank" rel="noreferrer" className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-transform hover:scale-105 ${links.content_plan ? 'bg-red-50 text-red-600 hover:bg-red-100 shadow-sm' : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'}`}>
                    📝 خطة المحتوى
                </a>
                <a href={links.marketing_plan || '#'} target="_blank" rel="noreferrer" className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-transform hover:scale-105 ${links.marketing_plan ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 shadow-sm' : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'}`}>
                    📢 خطة التسويق
                </a>
                <a href={links.media_plan || '#'} target="_blank" rel="noreferrer" className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-transform hover:scale-105 ${links.media_plan ? 'bg-purple-50 text-purple-600 hover:bg-purple-100 shadow-sm' : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'}`}>
                    🎥 خطة الميديا
                </a>
            </div>
          )}
      </Card>

      {/* Main Content Area */}
      <div className="min-h-[500px] bg-white rounded-t-2xl shadow-sm border border-gray-200 p-2">
          {loading ? (
              <div className="h-64 flex justify-center items-center"><LoadingSpinner /></div>
          ) : (
              renderTable()
          )}
      </div>

      {/* Bottom Tabs (Filtered Sheets) */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-100 border-t border-gray-300 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] z-40 lg:pl-72 overflow-x-auto">
          <div className="flex items-end px-2">
              {visibleTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`
                        px-6 py-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all rounded-t-lg mx-0.5
                        ${activeTab === tab.id 
                            ? `bg-white ${tab.color} border-l border-r border-t border-gray-300 translate-y-[1px] z-10 shadow-[0_-2px_5px_rgba(0,0,0,0.05)] pb-3` 
                            : 'bg-gray-200 text-gray-500 hover:bg-gray-300 border-b border-gray-300'
                        }
                    `}
                  >
                      {tab.label}
                  </button>
              ))}
          </div>
      </div>
    </div>
  );
};

export default PlansPage;
