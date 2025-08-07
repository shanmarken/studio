'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { ProjectPulseLogo } from '@/components/app/project-pulse-logo';

export default function ProjectsPage() {
  const projects = [
    {
      id: '1',
      name: 'Project Pulse',
      description: 'A next-gen project management tool to keep your development lifecycle on track.',
      lastUpdated: '2 days ago',
    },
    {
      id: '2',
      name: 'Website Redesign',
      description: 'A complete overhaul of the corporate website and branding.',
      lastUpdated: '5 days ago',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <ProjectPulseLogo />
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Your Projects
              </h1>
            </div>
            <Button className="gap-2">
              <PlusCircle />
              <span className="hidden sm:inline">Create Project</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((project) => (
            <Link href={`/projects/${project.id}`} key={project.id} className="block hover:no-underline">
              <Card className="hover:shadow-lg hover:-translate-y-1 transition-all h-full flex flex-col">
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription>{project.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow"></CardContent>
                <div className="p-4 pt-0 text-xs text-muted-foreground">
                    Last updated {project.lastUpdated}
                </div>
              </Card>
            </Link>
          ))}
           <Card className="border-dashed border-2 hover:border-primary hover:text-primary transition-colors flex items-center justify-center min-h-[200px] cursor-pointer">
              <div className="text-center">
                <PlusCircle className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-2 font-semibold">Create New Project</p>
              </div>
            </Card>
        </div>
      </main>
    </div>
  );
}
