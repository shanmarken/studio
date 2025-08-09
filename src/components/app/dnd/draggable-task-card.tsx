
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/lib/types';
import React from 'react';

interface DraggableTaskCardProps {
    task: Task;
    children: React.ReactElement;
}

export function DraggableTaskCard({ task, children }: DraggableTaskCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id, data: { task } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : 0,
    };

    return (
        <div ref={setNodeRef} style={style} >
            {React.cloneElement(children, { dragHandleProps: {...attributes, ...listeners} })}
        </div>
    );
}
