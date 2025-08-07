import { ProjectPulseLogo } from "@/components/app/project-pulse-logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background antialiased">
      {children}
    </div>
  );
}
