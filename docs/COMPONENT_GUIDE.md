# Component Usage Guide

This guide provides detailed usage instructions and examples for all components in the ProjectPulse application.

## Table of Contents

- [Getting Started](#getting-started)
- [UI Components](#ui-components)
- [Form Components](#form-components)
- [Layout Components](#layout-components)
- [Data Display Components](#data-display-components)
- [App-Specific Components](#app-specific-components)
- [Best Practices](#best-practices)

## Getting Started

All components are built with TypeScript and use Tailwind CSS for styling. They follow consistent patterns and can be easily customized.

### Basic Import Pattern
```tsx
import { ComponentName } from '@/components/ui/component-name'
// or for app components
import { ComponentName } from '@/components/app/component-name'
```

### Styling with Tailwind
All components accept a `className` prop that gets merged with default styles:
```tsx
<Button className="w-full bg-blue-500">Custom Button</Button>
```

## UI Components

### Button

The Button component is the foundation for user interactions.

#### Basic Usage
```tsx
import { Button } from '@/components/ui/button'

function BasicButtons() {
  return (
    <div className="space-x-4">
      <Button>Default Button</Button>
      <Button variant="outline">Outline Button</Button>
      <Button variant="ghost">Ghost Button</Button>
    </div>
  )
}
```

#### Button Variants
```tsx
function ButtonVariants() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Button variant="default">Primary Action</Button>
      <Button variant="secondary">Secondary Action</Button>
      <Button variant="destructive">Delete Item</Button>
      <Button variant="outline">Cancel</Button>
      <Button variant="ghost">Subtle Action</Button>
      <Button variant="link">Link Style</Button>
    </div>
  )
}
```

#### Button Sizes
```tsx
function ButtonSizes() {
  return (
    <div className="flex items-center space-x-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">
        <PlusIcon className="h-4 w-4" />
      </Button>
    </div>
  )
}
```

#### Loading State
```tsx
import { Loader2 } from 'lucide-react'

function LoadingButton() {
  const [isLoading, setIsLoading] = useState(false)
  
  return (
    <Button 
      disabled={isLoading}
      onClick={() => setIsLoading(true)}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isLoading ? 'Processing...' : 'Submit'}
    </Button>
  )
}
```

### Card

Cards are versatile containers for grouping related content.

#### Basic Card
```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function BasicCard() {
  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Project Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <p>This is the main content of the card.</p>
      </CardContent>
    </Card>
  )
}
```

#### Full Card Example
```tsx
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function ProjectCard({ project }) {
  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>{project.name}</CardTitle>
        <CardDescription>
          Created on {new Date(project.createdAt).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Total Tasks:</span>
            <span className="font-semibold">{project.totalTasks}</span>
          </div>
          <div className="flex justify-between">
            <span>Completed:</span>
            <span className="font-semibold text-green-600">{project.completedTasks}</span>
          </div>
          <div className="flex justify-between">
            <span>In Progress:</span>
            <span className="font-semibold text-blue-600">{project.inProgressTasks}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">View Details</Button>
        <Button>Open Project</Button>
      </CardFooter>
    </Card>
  )
}
```

### Dialog

Dialogs are modal overlays for focused interactions.

#### Basic Dialog
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

function BasicDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>
            This is a description of what this dialog does.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p>Dialog content goes here.</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

#### Form Dialog
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function CreateTaskDialog() {
  const [open, setOpen] = useState(false)
  const [taskName, setTaskName] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle form submission
    console.log('Creating task:', taskName)
    setOpen(false)
    setTaskName('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create New Task</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>
              Add a new task to your project. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className="col-span-3"
                placeholder="Enter task name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

### Input

Input components for form data collection.

#### Basic Input
```tsx
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function BasicInput() {
  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="Email" />
    </div>
  )
}
```

#### Input with Validation
```tsx
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'

function ValidatedInput() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const validateEmail = (value) => {
    if (!value) {
      setError('Email is required')
    } else if (!/\S+@\S+\.\S+/.test(value)) {
      setError('Email is invalid')
    } else {
      setError('')
    }
  }

  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input
        type="email"
        id="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value)
          validateEmail(e.target.value)
        }}
        placeholder="Enter your email"
        className={error ? 'border-red-500' : ''}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
```

### Select

Dropdown selection components.

#### Basic Select
```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

function BasicSelect() {
  return (
    <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a priority" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="high">High</SelectItem>
        <SelectItem value="medium">Medium</SelectItem>
        <SelectItem value="low">Low</SelectItem>
      </SelectContent>
    </Select>
  )
}
```

#### Controlled Select
```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

function ControlledSelect() {
  const [priority, setPriority] = useState('')

  return (
    <div className="space-y-2">
      <Label>Task Priority</Label>
      <Select value={priority} onValueChange={setPriority}>
        <SelectTrigger>
          <SelectValue placeholder="Select priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="high">High Priority</SelectItem>
          <SelectItem value="medium">Medium Priority</SelectItem>
          <SelectItem value="low">Low Priority</SelectItem>
        </SelectContent>
      </Select>
      {priority && (
        <p className="text-sm text-muted-foreground">
          Selected: {priority}
        </p>
      )}
    </div>
  )
}
```

### Table

Data tables for displaying structured information.

#### Basic Table
```tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function BasicTable() {
  const tasks = [
    { id: 1, name: 'Setup project', status: 'Completed', assignee: 'John' },
    { id: 2, name: 'Design UI', status: 'In Progress', assignee: 'Jane' },
    { id: 3, name: 'Write tests', status: 'To Do', assignee: 'Bob' },
  ]

  return (
    <Table>
      <TableCaption>A list of your recent tasks.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">ID</TableHead>
          <TableHead>Task Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Assignee</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow key={task.id}>
            <TableCell className="font-medium">{task.id}</TableCell>
            <TableCell>{task.name}</TableCell>
            <TableCell>{task.status}</TableCell>
            <TableCell className="text-right">{task.assignee}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

## Form Components

### Complete Form Example

```tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function TaskForm() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: '',
    assignee: '',
    estimatedHours: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Task</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taskName">Task Name</Label>
              <Input
                id="taskName"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter task name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="estimatedHours">Estimated Hours</Label>
              <Input
                id="estimatedHours"
                type="number"
                value={formData.estimatedHours}
                onChange={(e) => handleChange('estimatedHours', e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe the task..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => handleChange('priority', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select value={formData.assignee} onValueChange={(value) => handleChange('assignee', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="john">John Doe</SelectItem>
                  <SelectItem value="jane">Jane Smith</SelectItem>
                  <SelectItem value="bob">Bob Johnson</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline">
              Cancel
            </Button>
            <Button type="submit">
              Create Task
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
```

## Layout Components

### Sidebar Layout

```tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'

function SidebarLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <h2 className="text-lg font-semibold">Navigation</h2>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li><a href="/dashboard" className="block p-2 rounded hover:bg-gray-100">Dashboard</a></li>
          <li><a href="/projects" className="block p-2 rounded hover:bg-gray-100">Projects</a></li>
          <li><a href="/tasks" className="block p-2 rounded hover:bg-gray-100">Tasks</a></li>
          <li><a href="/settings" className="block p-2 rounded hover:bg-gray-100">Settings</a></li>
        </ul>
      </nav>
    </div>
  )

  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:bg-gray-50">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
```

## Data Display Components

### Task Card Component

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, User, Clock } from 'lucide-react'

function TaskCard({ task, onEdit, onDelete }) {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800'
      case 'In Progress': return 'bg-blue-100 text-blue-800'
      case 'Blocked': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{task.name}</CardTitle>
          <div className="flex space-x-2">
            <Badge className={getPriorityColor(task.priority)}>
              {task.priority}
            </Badge>
            <Badge className={getStatusColor(task.status)}>
              {task.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">{task.description}</p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <User className="w-4 h-4 mr-2" />
            Assigned to: {task.assignedTo}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-2" />
            Estimated: {task.estimatedHours} hours
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="w-4 h-4 mr-2" />
            Due: {new Date(task.endDate).toLocaleDateString()}
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Progress</span>
            <span>{task.percentComplete}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${task.percentComplete}%` }}
            ></div>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(task)}>
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(task.id)}>
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

## App-Specific Components

### Dashboard Overview

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

function DashboardOverview({ projectStats }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{projectStats.totalProjects}</div>
          <p className="text-xs text-muted-foreground">
            +2 from last month
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{projectStats.activeTasks}</div>
          <p className="text-xs text-muted-foreground">
            {projectStats.completedToday} completed today
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{projectStats.teamMembers}</div>
          <p className="text-xs text-muted-foreground">
            Across all projects
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{projectStats.completionRate}%</div>
          <Progress value={projectStats.completionRate} className="mt-2" />
        </CardContent>
      </Card>
    </div>
  )
}
```

### Project List

```tsx
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Plus } from 'lucide-react'

function ProjectList({ projects, onCreateProject, onSelectProject }) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Projects</h2>
        <Button onClick={onCreateProject}>
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => (
          <Card 
            key={project.id} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onSelectProject(project)}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                  {project.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{project.description}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
                <span>{project.taskCount} tasks</span>
                <span>{project.teamSize} members</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

## Best Practices

### 1. Component Composition

Always compose components rather than creating monolithic ones:

```tsx
// Good: Composed components
function TaskPage() {
  return (
    <div className="container mx-auto p-4">
      <TaskHeader />
      <TaskFilters />
      <TaskList />
    </div>
  )
}

// Avoid: Monolithic component
function TaskPage() {
  return (
    <div className="container mx-auto p-4">
      {/* Everything in one component */}
    </div>
  )
}
```

### 2. Props Interface

Always define clear TypeScript interfaces for props:

```tsx
interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  className?: string
}

function TaskCard({ task, onEdit, onDelete, className }: TaskCardProps) {
  // Component implementation
}
```

### 3. Event Handling

Use consistent event handling patterns:

```tsx
function TaskForm({ onSubmit, onCancel }) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Validation logic
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  )
}
```

### 4. Loading States

Always handle loading states gracefully:

```tsx
function TaskList({ tasks, loading, error }) {
  if (loading) {
    return <TaskListSkeleton />
  }

  if (error) {
    return <ErrorMessage error={error} />
  }

  if (tasks.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="space-y-4">
      {tasks.map(task => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  )
}
```

### 5. Responsive Design

Make components responsive by default:

```tsx
function DashboardGrid({ children }) {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {children}
    </div>
  )
}
```

### 6. Accessibility

Ensure components are accessible:

```tsx
function Button({ children, ...props }) {
  return (
    <button
      className="px-4 py-2 rounded focus:ring-2 focus:ring-blue-500"
      {...props}
    >
      {children}
    </button>
  )
}
```

---

This guide covers the most commonly used components and patterns in the ProjectPulse application. For more specific use cases, refer to the component source code or the API reference documentation.