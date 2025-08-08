
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
            {children}
        </SidebarInset>
    </SidebarProvider>
  );
}
