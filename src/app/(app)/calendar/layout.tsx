
'use client';

import { ProjectsSidebar } from '@/components/app/projects-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
        <ProjectsSidebar />
        <SidebarInset>
            <div className="flex flex-col min-h-screen bg-background">
                {children}
            </div>
        </SidebarInset>
    </SidebarProvider>
  );
}
