
'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronsRight } from 'lucide-react';
import { Status, Task } from '@/lib/types';

interface DroppableColumnProps {
    status: Status;
    tasks: Task[];
    children: React.ReactNode;
    isCollapsed: boolean;
    toggleCollapse: () => void;
}

const statusColorMap: Record<Status, string> = {
    'To Do': 'bg-gray-500',
    'In Progress': 'bg-blue-500',
    'Testing': 'bg-purple-500',
    Completed: 'bg-green-500',
    Blocked: 'bg-red-500',
};


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
                            <div className={cn("w-2 h-2 rounded-full mt-2", statusColorMap[status])}></div>
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
                        <div className={cn("w-3 h-3 rounded-full", statusColorMap[status])}></div>
                        <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2 uppercase">
                            {status}
                        </h2>
                        <span className="text-sm font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                            {tasks.length}
                        </span>
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

