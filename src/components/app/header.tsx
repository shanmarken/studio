import { Button } from '@/components/ui/button';
import { FileDown, PlusCircle, ArrowLeft } from 'lucide-react';
import { ProjectPulseLogo } from './project-pulse-logo';
import Link from 'next/link';

type HeaderProps = {
  onAddTask: () => void;
  onExport: () => void;
};

export function Header({ onAddTask, onExport }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-foreground hover:no-underline">
                <ArrowLeft className="h-5 w-5 md:hidden" />
                <ProjectPulseLogo />
            </Link>
            <div className="flex flex-col">
                <Link href="/" className="text-xs text-muted-foreground hidden md:block hover:underline">Projects</Link>
                <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                Project Pulse
                </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onAddTask} className="gap-2">
              <PlusCircle />
              <span className="hidden sm:inline">Add Task</span>
            </Button>
            <Button onClick={onExport} variant="outline" className="gap-2">
              <FileDown />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
