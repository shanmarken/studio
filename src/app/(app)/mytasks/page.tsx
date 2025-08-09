
'use client';

import { MyTasksClient } from '@/components/app/my-tasks-client';
import { MainHeader } from '@/components/app/main-header';
import { TaskDialog } from '@/components/app/task-dialog';
import { Task } from '@/lib/types';
import { useState } from 'react';

export default function MyTasksPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

  // In "My Tasks" view, we can only edit, not create, so we don't need a full onSave handler here.
  // The client component will handle the edit save logic.
  const handleSaveTask = () => {
    // This function is passed to the dialog, but the "My Task Client" handles the actual save.
    setIsTaskDialogOpen(false);
  }

  return (
    <div className="flex flex-col h-full">
      <MainHeader 
        title="My Tasks"
        showSearch={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddTask={() => setIsTaskDialogOpen(true)}
      />
      <MyTasksClient searchTerm={searchTerm} />
      {/* This dialog is opened by the Add Task button but will prompt to select a project */}
       <TaskDialog
        isOpen={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        onSave={handleSaveTask}
        tasks={[]}
      />
    </div>
  );
}
