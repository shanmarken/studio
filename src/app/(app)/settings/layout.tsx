
'use client';

import { ProjectsSidebar } from "@/components/app/projects-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function SettingsLayout({
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
