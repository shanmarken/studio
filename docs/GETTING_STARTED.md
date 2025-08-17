# Getting Started with ProjectPulse

Welcome to ProjectPulse! This guide will help you understand the codebase, set up your development environment, and start contributing to the project.

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Development Setup](#development-setup)
- [Documentation Structure](#documentation-structure)
- [Key Concepts](#key-concepts)
- [Common Tasks](#common-tasks)
- [Development Workflow](#development-workflow)

## Overview

ProjectPulse is a comprehensive project management application built with Next.js, React, and Firebase. It provides tools for task management, team collaboration, and project tracking with AI-powered features for task optimization.

### Key Features

- **Project Management**: Create and manage projects with phases and milestones
- **Task Tracking**: Comprehensive task management with status tracking, assignments, and progress monitoring
- **Team Collaboration**: User roles, team member management, and real-time updates
- **AI Integration**: AI-powered suggestions for task optimization using Google's Gemini AI
- **Responsive Design**: Mobile-first design with responsive layouts
- **Real-time Updates**: Firebase integration for real-time data synchronization

## Project Structure

```
ProjectPulse/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── (app)/             # Protected app routes
│   │   ├── (auth)/            # Authentication routes
│   │   ├── projects/          # Project-specific routes
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   └── app/               # App-specific components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility functions and configurations
│   ├── services/              # API services and data fetching
│   └── ai/                    # AI flows and GenKit configuration
├── docs/                      # Documentation files
├── public/                    # Static assets
├── package.json               # Dependencies and scripts
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
└── next.config.ts             # Next.js configuration
```

## Technology Stack

### Core Technologies

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **State Management**: React Context + Firebase real-time updates
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **AI**: Google GenKit with Gemini AI

### Development Tools

- **Package Manager**: npm
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **Build Tool**: Next.js with Turbopack
- **Deployment**: Firebase Hosting

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project with Firestore and Authentication enabled
- Google AI API key for GenKit features

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd projectpulse
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   Create a `.env.local` file with your Firebase and AI credentials:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Start GenKit development server** (optional, for AI features)
   ```bash
   npm run genkit:dev
   ```

### Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication with Email/Password provider
3. Create a Firestore database
4. Set up Firestore security rules (see `firestore.rules`)
5. Add your web app configuration to environment variables

## Documentation Structure

This project includes comprehensive documentation:

- **[API_REFERENCE.md](./API_REFERENCE.md)**: Complete API documentation for all functions, components, and hooks
- **[COMPONENT_GUIDE.md](./COMPONENT_GUIDE.md)**: Detailed usage guide for UI and app components
- **[HOOKS_DOCUMENTATION.md](./HOOKS_DOCUMENTATION.md)**: Documentation for custom React hooks
- **This file**: Getting started guide and project overview

## Key Concepts

### Authentication & Authorization

The app uses Firebase Authentication with role-based access control:

```typescript
import { useAuth } from '@/hooks/use-auth'

function MyComponent() {
  const { user, loading } = useAuth()
  
  // user.role can be 'admin', 'developer', or 'management'
  if (user?.role === 'admin') {
    // Admin-only features
  }
}
```

### Data Models

Core data structures are defined in `src/lib/types.ts`:

- **Task**: Main task entity with status, priority, assignments, etc.
- **User**: User with role-based permissions
- **Project**: Container for tasks and team members
- **Release**: Project releases and versions

### Component Architecture

Components follow a consistent pattern:

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

### Styling System

- **Tailwind CSS**: Utility-first CSS framework
- **CSS Variables**: Theme system with dark/light mode support
- **Component Variants**: Using `class-variance-authority` for component variants
- **Responsive Design**: Mobile-first approach

## Common Tasks

### Creating a New Component

1. **UI Component** (in `src/components/ui/`):
   ```typescript
   import * as React from "react"
   import { cn } from "@/lib/utils"
   
   interface MyComponentProps extends React.HTMLAttributes<HTMLDivElement> {
     variant?: "default" | "secondary"
   }
   
   const MyComponent = React.forwardRef<HTMLDivElement, MyComponentProps>(
     ({ className, variant = "default", ...props }, ref) => {
       return (
         <div
           ref={ref}
           className={cn("base-styles", variant === "secondary" && "secondary-styles", className)}
           {...props}
         />
       )
     }
   )
   MyComponent.displayName = "MyComponent"
   
   export { MyComponent }
   ```

2. **App Component** (in `src/components/app/`):
   ```typescript
   import { MyComponent } from "@/components/ui/my-component"
   import { useAuth } from "@/hooks/use-auth"
   
   interface AppComponentProps {
     // App-specific props
   }
   
   export function AppComponent({ ...props }: AppComponentProps) {
     const { user } = useAuth()
     
     return (
       <MyComponent>
         {/* App-specific logic */}
       </MyComponent>
     )
   }
   ```

### Adding a New Page

1. Create a file in `src/app/` following the App Router conventions
2. Use the appropriate layout (app layout for protected routes)
3. Implement proper loading and error states

### Creating a Custom Hook

```typescript
import { useState, useEffect } from 'react'

export function useMyHook() {
  const [state, setState] = useState(initialValue)
  
  useEffect(() => {
    // Effect logic
  }, [])
  
  return { state, setState }
}
```

### Adding AI Features

1. Create a new flow in `src/ai/flows/`
2. Define input/output schemas with Zod
3. Use the GenKit AI instance from `src/ai/genkit.ts`

### Styling Guidelines

- Use Tailwind utility classes
- Follow the design system color palette
- Ensure responsive design with mobile-first approach
- Use the `cn()` utility for conditional classes

## Development Workflow

### Code Quality

1. **TypeScript**: All code should be properly typed
2. **ESLint**: Follow the configured linting rules
3. **Component Props**: Always define TypeScript interfaces for props
4. **Error Handling**: Implement proper error boundaries and loading states

### Testing Strategy

- Unit tests for utility functions
- Component tests for UI components
- Integration tests for complex workflows
- Mock Firebase services for testing

### Git Workflow

1. Create feature branches from main
2. Make small, focused commits
3. Write descriptive commit messages
4. Test thoroughly before pushing
5. Create pull requests for code review

### Deployment

The app is configured for Firebase Hosting:

```bash
npm run build
firebase deploy
```

## Best Practices

### Performance

- Use React.memo for expensive components
- Implement proper loading states
- Optimize images and assets
- Use Next.js Image component for images

### Accessibility

- Use semantic HTML elements
- Implement proper ARIA attributes
- Ensure keyboard navigation
- Test with screen readers

### Security

- Validate all user inputs
- Use Firestore security rules
- Implement proper authentication checks
- Sanitize data before display

### Code Organization

- Keep components small and focused
- Use custom hooks for reusable logic
- Separate business logic from UI components
- Follow consistent naming conventions

## Troubleshooting

### Common Issues

1. **Firebase Connection**: Check environment variables and Firebase configuration
2. **TypeScript Errors**: Ensure all types are properly defined
3. **Styling Issues**: Check Tailwind classes and CSS variable definitions
4. **Authentication**: Verify Firebase Auth setup and user roles

### Debug Tools

- React Developer Tools
- Firebase Console
- Network tab for API calls
- Console logs for debugging

## Getting Help

- Check the documentation files in `/docs`
- Review component examples in the codebase
- Look at existing implementations for patterns
- Use TypeScript IntelliSense for API guidance

---

This guide provides the foundation for working with ProjectPulse. For detailed API documentation, component usage, and specific implementation details, refer to the other documentation files in the `/docs` directory.