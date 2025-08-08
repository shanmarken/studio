
'use client';

import { MainHeader } from '@/components/app/main-header';
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
            <div className="flex flex-col h-screen overflow-hidden bg-muted/40">
                <MainHeader title="Calendar" />
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </div>
        </SidebarInset>
    </SidebarProvider>
  );
}
