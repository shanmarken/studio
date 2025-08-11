
'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronsRight } from 'lucide-react';
import { Status, Task } from '@/lib/types';

interface DroppableColumnProps {
    status: string; // Keep as string to represent phase
    tasks: Task[];
    children: React.ReactNode;
    isCollapsed: boolean;
    toggleCollapse: () => void;
}

export function DroppableColumn({ status, tasks, children, isCollapsed, toggleCollapse }: DroppableColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: status,
    });

    return (
        <Collapsible
            open={!isCollapsed}
            onOpenChange={toggleCollapse}
            className={cn(
                "flex flex-col rounded-lg border bg-background transition-all duration-300",
                isCollapsed ? 'w-16' : 'flex-shrink-0 w-80 md:w-96',
                isOver && 'border-primary ring-2 ring-primary'
            )}
        >
            <div className={cn("flex-shrink-0 p-4 border-b", isCollapsed ? 'h-full relative' : 'flex items-center gap-2')}>
                {isCollapsed ? (
                    <div className="h-full flex flex-col items-center justify-between py-4">
                        <div className="flex flex-col items-center">
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <ChevronsRight className={cn("h-4 w-4 transition-transform", !isCollapsed ? 'rotate-90' : 'rotate-0')} />
                                </Button>
                            </CollapsibleTrigger>
                        </div>
                        <h2 className="text-sm font-semibold tracking-widest uppercase text-muted-foreground [writing-mode:vertical-rl] rotate-180">
                            {status}
                        </h2>
                        <div className="text-sm font-bold">{tasks.length}</div>
                    </div>
                ) : (
                    <>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                <ChevronsRight className={cn("h-4 w-4 transition-transform", !isCollapsed ? 'rotate-90' : 'rotate-0')} />
                            </Button>
                        </CollapsibleTrigger>
                        <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                          {status}
                          <span className="text-sm font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                            {tasks.length}
                          </span>
                        </h2>
                    </>
                )}
            </div>
            <CollapsibleContent asChild>
                <div ref={setNodeRef} className="space-y-4 overflow-y-auto flex-1 p-4 min-h-[100px]">
                    {children}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}
