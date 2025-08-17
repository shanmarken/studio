# Custom Hooks Documentation

This document provides comprehensive documentation for all custom React hooks used in the ProjectPulse application.

## Table of Contents

- [Overview](#overview)
- [Authentication Hooks](#authentication-hooks)
- [UI Hooks](#ui-hooks)
- [Toast Hooks](#toast-hooks)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

## Overview

The ProjectPulse application includes several custom hooks that provide reusable stateful logic for common functionality like authentication, responsive design, and user notifications.

## Authentication Hooks

### `useAuth()`

**Location:** `src/hooks/use-auth.tsx`

A comprehensive authentication hook that provides user state management with Firebase Authentication and Firestore integration.

#### Type Definitions

```typescript
interface User extends FirebaseUser {
  role?: UserRole;
}

interface AuthContextType {
  user: User | null | undefined;
  loading: boolean;
  error: Error | undefined;
}
```

#### Usage

```typescript
import { useAuth } from '@/hooks/use-auth'

function MyComponent() {
  const { user, loading, error } = useAuth()
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!user) return <div>Please log in</div>
  
  return (
    <div>
      <h1>Welcome, {user.displayName || user.email}</h1>
      <p>Role: {user.role}</p>
    </div>
  )
}
```

#### Features

- **Firebase Integration**: Seamlessly integrates with Firebase Auth
- **Role Management**: Automatically fetches user roles from Firestore
- **Real-time Updates**: Listens for role changes in real-time
- **Error Handling**: Provides comprehensive error states
- **Admin Override**: Special handling for admin users
- **Loading States**: Clear loading indicators

#### Implementation Details

```typescript
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

#### Provider Setup

The hook must be used within an `AuthProvider`:

```typescript
import { AuthProvider } from '@/hooks/use-auth'

function App() {
  return (
    <AuthProvider>
      <YourAppComponents />
    </AuthProvider>
  )
}
```

#### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `user` | `User \| null \| undefined` | Current authenticated user with role information |
| `loading` | `boolean` | Whether authentication state is being determined |
| `error` | `Error \| undefined` | Any authentication errors that occurred |

#### User States

- `undefined`: Initial state, authentication status unknown
- `null`: User is not authenticated
- `User object`: User is authenticated with role information

## UI Hooks

### `useIsMobile()`

**Location:** `src/hooks/use-mobile.tsx`

A responsive design hook that detects mobile screen sizes and provides a boolean value for conditional rendering.

#### Usage

```typescript
import { useIsMobile } from '@/hooks/use-mobile'

function ResponsiveComponent() {
  const isMobile = useIsMobile()
  
  return (
    <div className={isMobile ? 'mobile-layout' : 'desktop-layout'}>
      {isMobile ? (
        <MobileNavigation />
      ) : (
        <DesktopNavigation />
      )}
    </div>
  )
}
```

#### Features

- **Responsive Breakpoint**: Uses 768px as the mobile breakpoint
- **Real-time Updates**: Automatically updates when window is resized
- **Performance Optimized**: Uses `matchMedia` for efficient listening
- **SSR Safe**: Returns `false` initially to prevent hydration issues

#### Implementation Details

```typescript
const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
```

#### Return Value

| Type | Description |
|------|-------------|
| `boolean` | `true` if viewport width is less than 768px, `false` otherwise |

#### Use Cases

- Conditional component rendering
- Responsive navigation menus
- Mobile-specific layouts
- Touch vs mouse interaction handling

## Toast Hooks

### `useToast()`

**Location:** `src/hooks/use-toast.ts`

A comprehensive toast notification system for displaying user feedback messages.

#### Usage

```typescript
import { useToast } from '@/hooks/use-toast'

function MyComponent() {
  const { toast } = useToast()
  
  const handleSuccess = () => {
    toast({
      title: "Success!",
      description: "Your task has been created successfully.",
      variant: "default",
    })
  }
  
  const handleError = () => {
    toast({
      title: "Error",
      description: "Failed to create task. Please try again.",
      variant: "destructive",
    })
  }
  
  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
    </div>
  )
}
```

#### Toast Options

```typescript
interface ToastProps {
  title?: string;
  description?: string;
  action?: React.ReactElement;
  variant?: "default" | "destructive";
  duration?: number;
}
```

#### Features

- **Multiple Variants**: Default and destructive styling
- **Auto Dismiss**: Configurable duration with auto-dismiss
- **Action Buttons**: Support for custom action buttons
- **Queue Management**: Handles multiple toasts gracefully
- **Accessibility**: ARIA compliant with screen reader support

#### Advanced Usage

```typescript
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'

function AdvancedToastExample() {
  const { toast } = useToast()
  
  const showActionToast = () => {
    toast({
      title: "Task Updated",
      description: "Your task status has been changed to 'In Progress'",
      action: (
        <Button variant="outline" size="sm">
          Undo
        </Button>
      ),
      duration: 5000,
    })
  }
  
  const showPersistentToast = () => {
    toast({
      title: "Important Notice",
      description: "This message will stay until manually dismissed",
      variant: "destructive",
      duration: Infinity, // Won't auto-dismiss
    })
  }
  
  return (
    <div className="space-x-2">
      <Button onClick={showActionToast}>Action Toast</Button>
      <Button onClick={showPersistentToast}>Persistent Toast</Button>
    </div>
  )
}
```

#### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `toast` | `function` | Function to trigger a new toast notification |
| `dismiss` | `function` | Function to dismiss a specific toast by ID |
| `toasts` | `array` | Array of currently active toasts |

## Usage Examples

### Authentication Flow

```typescript
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'

function UserProfile() {
  const { user, loading } = useAuth()
  const { toast } = useToast()
  
  const handleSignOut = async () => {
    try {
      await signOut(auth)
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      })
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "Please try again.",
        variant: "destructive",
      })
    }
  }
  
  if (loading) {
    return <div>Loading user profile...</div>
  }
  
  if (!user) {
    return <div>Please sign in to view your profile.</div>
  }
  
  return (
    <div className="space-y-4">
      <h1>User Profile</h1>
      <div>
        <p><strong>Name:</strong> {user.displayName}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role}</p>
      </div>
      <button onClick={handleSignOut}>Sign Out</button>
    </div>
  )
}
```

### Responsive Layout

```typescript
import { useIsMobile } from '@/hooks/use-mobile'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'

function ResponsiveNavigation() {
  const isMobile = useIsMobile()
  
  const NavigationItems = () => (
    <nav className="space-y-2">
      <a href="/dashboard">Dashboard</a>
      <a href="/projects">Projects</a>
      <a href="/tasks">Tasks</a>
      <a href="/settings">Settings</a>
    </nav>
  )
  
  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <NavigationItems />
        </SheetContent>
      </Sheet>
    )
  }
  
  return (
    <aside className="w-64 bg-gray-50 p-4">
      <NavigationItems />
    </aside>
  )
}
```

### Form with Toast Feedback

```typescript
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function TaskForm() {
  const [taskName, setTaskName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Task created",
        description: `"${taskName}" has been added to your project.`,
      })
      
      setTaskName('')
    } catch (error) {
      toast({
        title: "Failed to create task",
        description: "Please check your connection and try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        value={taskName}
        onChange={(e) => setTaskName(e.target.value)}
        placeholder="Enter task name"
        required
      />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Task'}
      </Button>
    </form>
  )
}
```

## Best Practices

### 1. Hook Composition

Combine hooks for powerful functionality:

```typescript
function useAuthenticatedToast() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const authToast = (message: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to perform this action.",
        variant: "destructive",
      })
      return false
    }
    
    toast({
      title: "Success",
      description: message,
    })
    return true
  }
  
  return { authToast, user }
}
```

### 2. Error Boundaries

Use hooks within error boundaries:

```typescript
function SafeComponent() {
  try {
    const { user } = useAuth()
    return <div>Welcome {user?.displayName}</div>
  } catch (error) {
    return <div>Authentication service unavailable</div>
  }
}
```

### 3. Conditional Hook Usage

Always call hooks at the top level:

```typescript
// ✅ Good
function MyComponent({ showAuth }: { showAuth: boolean }) {
  const { user } = useAuth()
  const isMobile = useIsMobile()
  
  if (!showAuth) {
    return <div>Auth disabled</div>
  }
  
  return <div>{user?.displayName}</div>
}

// ❌ Bad
function MyComponent({ showAuth }: { showAuth: boolean }) {
  if (showAuth) {
    const { user } = useAuth() // This violates rules of hooks
    return <div>{user?.displayName}</div>
  }
  
  return <div>Auth disabled</div>
}
```

### 4. Performance Optimization

Memoize expensive operations:

```typescript
import { useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'

function UserPermissions() {
  const { user } = useAuth()
  
  const permissions = useMemo(() => {
    if (!user) return []
    
    switch (user.role) {
      case 'admin':
        return ['read', 'write', 'delete', 'manage']
      case 'developer':
        return ['read', 'write']
      case 'management':
        return ['read', 'manage']
      default:
        return ['read']
    }
  }, [user?.role])
  
  return (
    <div>
      <h3>Your Permissions:</h3>
      <ul>
        {permissions.map(permission => (
          <li key={permission}>{permission}</li>
        ))}
      </ul>
    </div>
  )
}
```

### 5. Testing Hooks

Mock hooks for testing:

```typescript
// __mocks__/use-auth.ts
export const useAuth = () => ({
  user: {
    uid: 'test-user',
    email: 'test@example.com',
    displayName: 'Test User',
    role: 'developer'
  },
  loading: false,
  error: undefined
})
```

---

This documentation covers all custom hooks in the ProjectPulse application. Each hook is designed to be reusable, composable, and follows React best practices for custom hook development.