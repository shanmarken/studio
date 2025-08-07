import { ProjectPulseLogo } from "@/components/app/project-pulse-logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <ProjectPulseLogo />
        </div>
        {children}
      </div>
    </div>
  );
}
