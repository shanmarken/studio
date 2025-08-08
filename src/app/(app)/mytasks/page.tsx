
'use client';

import { MyTasksClient } from '@/components/app/my-tasks-client';
import { MainHeader } from '@/components/app/main-header';
import { useState } from 'react';

export default function MyTasksPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <>
      <MainHeader 
        title="My Tasks"
        showSearch={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      <MyTasksClient searchTerm={searchTerm} />
    </>
  );
}
