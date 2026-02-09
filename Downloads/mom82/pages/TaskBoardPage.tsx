
import React from 'react';
import KanbanBoard from '../components/tasks/KanbanBoard';
import { AuthService } from '../services/authService';
import { useState, useEffect } from 'react';
import LoadingSpinner from '../components/common/LoadingSpinner';

const TaskBoardPage: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
        const session = await AuthService.getCurrentSession();
        setIsAdmin(!!session?.isAdmin);
        setEmployeeId(session?.employeeId);
        setLoading(false);
    };
    init();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="h-[calc(100vh-100px)]">
      <KanbanBoard isAdmin={isAdmin} employeeId={employeeId} />
    </div>
  );
};

export default TaskBoardPage;
