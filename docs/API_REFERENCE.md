# API Reference

This document provides comprehensive documentation for all public APIs, functions, components, hooks, and services in the ProjectPulse application.

## Table of Contents

- [Types & Interfaces](#types--interfaces)
- [Utility Functions](#utility-functions)
- [Constants](#constants)
- [Custom Hooks](#custom-hooks)
- [Services](#services)
- [AI Flows](#ai-flows)
- [UI Components](#ui-components)
- [App Components](#app-components)

## Types & Interfaces

### Core Types

#### `Status`
```typescript
type Status = 'To Do' | 'In Progress' | 'Testing' | 'Completed' | 'Blocked'
```
Represents the current status of a task in the project workflow.

#### `Priority`
```typescript
type Priority = 'High' | 'Medium' | 'Low'
```
Represents the priority level of a task.

#### `UserRole`
```typescript
type UserRole = 'admin' | 'developer' | 'management'
```
Represents the role of a user in the system with different permission levels.

### Data Models

#### `Task`
```typescript
interface Task {
  id: string;
  name: string;
  description: string;
  assignedTo: string;
  assignedToId?: string;
  priority: Priority;
  estimatedHours: number;
  startDate: Date;
  endDate: Date;
  status: Status;
  percentComplete: number;
  dependencies?: string;
  notes?: string;
  phase: string;
  subTasks?: SubTask[];
  comments?: Comment[];
  attachments?: Attachment[];
  projectId?: string;
  releaseId?: string;
}
```
Core data model representing a project task with all its properties and metadata.

**Properties:**
- `id` - Unique identifier for the task
- `name` - Display name of the task
- `description` - Detailed description of what the task involves
- `assignedTo` - Name of the person assigned to the task
- `assignedToId` - Optional user ID of the assigned person
- `priority` - Task priority level (High, Medium, Low)
- `estimatedHours` - Estimated time to complete the task
- `startDate` - When the task should start
- `endDate` - When the task should be completed
- `status` - Current status of the task
- `percentComplete` - Progress percentage (0-100)
- `dependencies` - Optional description of task dependencies
- `notes` - Optional additional notes
- `phase` - Project phase this task belongs to
- `subTasks` - Optional array of subtasks
- `comments` - Optional array of comments
- `attachments` - Optional array of file attachments
- `projectId` - Optional project identifier
- `releaseId` - Optional release identifier

#### `SubTask`
```typescript
interface SubTask {
  id: string;
  name: string;
  completed: boolean;
}
```
Represents a smaller task within a main task.

#### `Comment`
```typescript
interface Comment {
  id: string;
  author: string;
  authorId: string;
  text: string;
  createdAt: Date;
}
```
Represents a comment on a task.

#### `Attachment`
```typescript
interface Attachment {
  name: string;
  url: string;
  type: string;
}
```
Represents a file attachment on a task.

#### `Release`
```typescript
interface Release {
  id: string;
  name: string;
  projectId: string;
  createdAt: any;
}
```
Represents a project release.

#### `User`
```typescript
interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
}
```
Represents a user in the system.

## Utility Functions

### `cn(...inputs: ClassValue[])`
```typescript
function cn(...inputs: ClassValue[]): string
```
Utility function for combining and merging CSS class names using clsx and tailwind-merge.

**Parameters:**
- `inputs` - Array of class values to combine

**Returns:** Merged class string

**Example:**
```typescript
import { cn } from '@/lib/utils'

const className = cn(
  'base-class',
  condition && 'conditional-class',
  { 'object-class': true }
)
```

### `exportToCsv(tasks: Task[], filename: string)`
```typescript
function exportToCsv(tasks: Task[], filename: string): void
```
Exports an array of tasks to a CSV file and triggers download.

**Parameters:**
- `tasks` - Array of Task objects to export
- `filename` - Name of the CSV file to download

**Example:**
```typescript
import { exportToCsv } from '@/lib/utils'

const tasks = [/* array of tasks */]
exportToCsv(tasks, 'project-tasks.csv')
```

## Constants

### `PHASES`
```typescript
const PHASES: string[]
```
Array of standard project phases:
- Requirements
- SRS
- UI/UX Design
- Database Design
- Backend Development
- Frontend Development
- User Testing
- Software Testing (QA)
- Deployment
- Post-Deployment Monitoring

### `STATUSES`
```typescript
const STATUSES: Status[]
```
Array of available task statuses: `['To Do', 'In Progress', 'Testing', 'Completed', 'Blocked']`

### `PRIORITIES`
```typescript
const PRIORITIES: Priority[]
```
Array of available task priorities: `['High', 'Medium', 'Low']`

## Custom Hooks

### `useAuth()`
```typescript
function useAuth(): AuthContextType
```
Custom hook for authentication state management.

**Returns:**
```typescript
interface AuthContextType {
  user: User | null | undefined;
  loading: boolean;
  error: Error | undefined;
}
```

**Usage:**
```typescript
import { useAuth } from '@/hooks/use-auth'

function MyComponent() {
  const { user, loading, error } = useAuth()
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!user) return <div>Please log in</div>
  
  return <div>Welcome, {user.displayName}</div>
}
```

### `useIsMobile()`
```typescript
function useIsMobile(): boolean
```
Custom hook to detect mobile screen size (< 768px).

**Returns:** Boolean indicating if the current viewport is mobile size

**Usage:**
```typescript
import { useIsMobile } from '@/hooks/use-mobile'

function ResponsiveComponent() {
  const isMobile = useIsMobile()
  
  return (
    <div className={isMobile ? 'mobile-layout' : 'desktop-layout'}>
      Content
    </div>
  )
}
```

## Services

### Project Service

#### `getProjectWithTasks(projectId: string)`
```typescript
async function getProjectWithTasks(projectId: string): Promise<ProjectWithTasks | null>
```
Fetches a project and its associated tasks from Firestore.

**Parameters:**
- `projectId` - The ID of the project to fetch

**Returns:** Promise that resolves to ProjectWithTasks object or null if not found

**Example:**
```typescript
import { getProjectWithTasks } from '@/services/project-service'

async function loadProject(id: string) {
  try {
    const project = await getProjectWithTasks(id)
    if (project) {
      console.log(`Loaded project: ${project.name}`)
      console.log(`Tasks: ${project.tasks.length}`)
    }
  } catch (error) {
    console.error('Failed to load project:', error)
  }
}
```

#### `ProjectWithTasks`
```typescript
interface ProjectWithTasks {
  id: string;
  name: string;
  description?: string;
  tasks: Array<{
    id: string;
    name: string;
    status?: string;
    assignedTo?: string | null;
  }>;
}
```

## AI Flows

### `suggestUpdates(input: SuggestUpdatesInput)`
```typescript
async function suggestUpdates(input: SuggestUpdatesInput): Promise<SuggestUpdatesOutput>
```
AI-powered function that suggests updates for stalled tasks using Google's Gemini AI.

**Parameters:**
```typescript
interface SuggestUpdatesInput {
  phase: string;
  taskName: string;
  taskDescription: string;
  assignedTeamMember: string;
  priority: 'High' | 'Medium' | 'Low';
  estimatedHours: number;
  startDate: string; // ISO format
  endDate: string; // ISO format
  currentStatus: 'To Do' | 'In Progress' | 'Testing' | 'Completed' | 'Blocked';
  percentComplete: number;
  dependencies?: string;
  notes?: string;
}
```

**Returns:**
```typescript
interface SuggestUpdatesOutput {
  suggestedUpdates: Array<{
    title: string;
    description: string;
    category: 'Re-scoping' | 'Re-assignment' | 'Dependency Management' | 'Investigation' | 'Communication';
  }>;
}
```

**Example:**
```typescript
import { suggestUpdates } from '@/ai/flows/suggest-updates'

async function getSuggestions() {
  const suggestions = await suggestUpdates({
    phase: 'Backend Development',
    taskName: 'Implement user authentication',
    taskDescription: 'Create JWT-based authentication system',
    assignedTeamMember: 'John Doe',
    priority: 'High',
    estimatedHours: 20,
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-01-05T00:00:00Z',
    currentStatus: 'In Progress',
    percentComplete: 30,
    notes: 'Blocked on database schema decisions'
  })
  
  suggestions.suggestedUpdates.forEach(update => {
    console.log(`${update.category}: ${update.title}`)
    console.log(update.description)
  })
}
```

## UI Components

The application uses a comprehensive set of UI components built on top of Radix UI primitives with Tailwind CSS styling.

### Button

#### `Button`
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}
```

**Variants:**
- `default` - Primary button with solid background
- `destructive` - Red button for dangerous actions
- `outline` - Button with border and transparent background
- `secondary` - Secondary styling with muted colors
- `ghost` - Minimal button with no background
- `link` - Text button styled as a link

**Sizes:**
- `default` - Standard size (h-10 px-4 py-2)
- `sm` - Small size (h-9 px-3)
- `lg` - Large size (h-11 px-8)
- `icon` - Square icon button (h-10 w-10)

**Example:**
```tsx
import { Button } from '@/components/ui/button'

function MyComponent() {
  return (
    <div className="space-x-2">
      <Button variant="default">Primary</Button>
      <Button variant="outline">Secondary</Button>
      <Button variant="destructive">Delete</Button>
      <Button size="sm">Small</Button>
      <Button size="icon">
        <Icon />
      </Button>
    </div>
  )
}
```

### Card

#### `Card` Components
A set of components for creating card layouts:

- `Card` - Main container
- `CardHeader` - Header section
- `CardTitle` - Title element
- `CardDescription` - Description text
- `CardContent` - Main content area
- `CardFooter` - Footer section

**Example:**
```tsx
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card'

function ProjectCard({ project }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{project.name}</CardTitle>
        <CardDescription>{project.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Tasks: {project.taskCount}</p>
      </CardContent>
      <CardFooter>
        <Button>View Project</Button>
      </CardFooter>
    </Card>
  )
}
```

### Dialog

#### `Dialog` Components
Modal dialog components built on Radix UI:

- `Dialog` - Root component
- `DialogTrigger` - Trigger element
- `DialogContent` - Modal content container
- `DialogHeader` - Header section
- `DialogTitle` - Modal title
- `DialogDescription` - Modal description
- `DialogFooter` - Footer section
- `DialogClose` - Close button

**Example:**
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

function CreateTaskDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Create Task</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new task.
          </DialogDescription>
        </DialogHeader>
        {/* Form content */}
        <DialogFooter>
          <Button type="submit">Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

## App Components

### Dashboard Components

#### `Dashboard`
Main dashboard component that displays project overview and statistics.

#### `TaskCard`
Component for displaying individual task information in a card format.

#### `TaskDialog`
Modal dialog for creating and editing tasks with full form functionality.

#### `CalendarView`
Calendar component for viewing tasks and deadlines in a calendar format.

#### `MyTasksClient`
Client-side component for displaying and managing user's assigned tasks.

### Project Management Components

#### `CreateProjectDialog`
Modal dialog for creating new projects.

#### `ProjectSidebar`
Sidebar component for project navigation and quick actions.

#### `TeamMembersTable`
Table component for displaying and managing team members.

#### `ManageReleasesDialog`
Dialog for managing project releases and versions.

### Authentication Components

#### `AuthProvider`
Context provider component that wraps the application to provide authentication state.

**Usage:**
```tsx
import { AuthProvider } from '@/hooks/use-auth'

function App() {
  return (
    <AuthProvider>
      {/* Your app components */}
    </AuthProvider>
  )
}
```

## Component Guidelines

### Props Pattern
Most components follow this pattern:
```typescript
interface ComponentProps extends React.HTMLAttributes<HTMLElement> {
  // Component-specific props
}

const Component = React.forwardRef<HTMLElement, ComponentProps>(
  ({ className, ...props }, ref) => {
    return (
      <element
        ref={ref}
        className={cn("default-classes", className)}
        {...props}
      />
    )
  }
)
```

### Styling
- All components use Tailwind CSS for styling
- The `cn()` utility function merges classes properly
- Components support className override for customization
- Consistent design system with CSS variables for theming

### Accessibility
- Components built on Radix UI primitives include ARIA attributes
- Keyboard navigation support
- Screen reader compatibility
- Focus management

---

This API reference covers all public interfaces in the ProjectPulse application. For implementation details and examples, refer to the individual component files in the source code.