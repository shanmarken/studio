
'use client';

import { ProjectsSidebar } from '@/components/app/projects-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default function MyTasksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
        <ProjectsSidebar />
        <SidebarInset>
            <div className="h-screen flex flex-col">
              <div className="flex-1 overflow-auto">
                {children}
              </div>
            </div>
        </SidebarInset>
    </SidebarProvider>
  );
}
