import { Button } from '@/components/ui/button';
import { FileDown, PlusCircle } from 'lucide-react';
import { ProjectPulseLogo } from './project-pulse-logo';

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
            <ProjectPulseLogo />
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Project Pulse
            </h1>
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
