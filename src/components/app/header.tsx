import { Button } from '@/components/ui/button';
import { FileDown, PlusCircle, ArrowLeft, LogOut } from 'lucide-react';
import { ProjectPulseLogo } from './project-pulse-logo';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';
import { UserAvatar } from './user-avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type HeaderProps = {
  onAddTask: () => void;
  onExport: () => void;
};

export function Header({ onAddTask, onExport }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link href="/projects" className="flex items-center gap-2 text-foreground hover:no-underline">
                <ArrowLeft className="h-5 w-5 md:hidden" />
                <ProjectPulseLogo />
            </Link>
            <div className="flex flex-col">
                <Link href="/projects" className="text-xs text-muted-foreground hidden md:block hover:underline">Projects</Link>
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
            {user && (
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <UserAvatar name={user.email || 'User'} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">My Account</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => auth.signOut()}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
              )}
          </div>
        </div>
      </div>
    </header>
  );
}
