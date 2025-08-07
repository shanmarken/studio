import Dashboard from "@/components/app/dashboard";
import AppLayout from "@/app/(app)/layout";

export default function ProjectPage() {
  return (
    <AppLayout>
      <main className="h-full bg-background">
        <Dashboard />
      </main>
    </AppLayout>
  );
}
