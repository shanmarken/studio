# ProjectPulse Documentation

Welcome to the comprehensive documentation for ProjectPulse, a modern project management application built with Next.js, React, TypeScript, and Firebase.

## 📚 Documentation Overview

This documentation provides everything you need to understand, use, and contribute to the ProjectPulse codebase. Whether you're a new developer joining the team or an experienced contributor, these guides will help you navigate the application architecture and implement new features effectively.

## 🚀 Quick Start

**New to ProjectPulse?** Start here:

1. **[Getting Started Guide](./GETTING_STARTED.md)** - Complete setup and introduction
2. **[API Reference](./API_REFERENCE.md)** - Core APIs and functions
3. **[Component Guide](./COMPONENT_GUIDE.md)** - UI components and usage examples

## 📖 Documentation Structure

### Core Documentation

| Document | Description | Target Audience |
|----------|-------------|-----------------|
| **[Getting Started](./GETTING_STARTED.md)** | Project overview, setup instructions, and development workflow | All developers |
| **[API Reference](./API_REFERENCE.md)** | Comprehensive API documentation for all public functions, components, and services | All developers |
| **[Component Guide](./COMPONENT_GUIDE.md)** | Detailed usage examples and best practices for UI components | Frontend developers |
| **[Hooks Documentation](./HOOKS_DOCUMENTATION.md)** | Custom React hooks with usage examples and patterns | React developers |

### What's Covered

#### 🏗️ Architecture & Setup
- Project structure and organization
- Technology stack overview
- Development environment setup
- Firebase configuration
- Deployment procedures

#### 🧩 Components & UI
- **37+ UI Components** documented with examples
- Radix UI primitives integration
- Tailwind CSS styling patterns
- Responsive design guidelines
- Accessibility best practices

#### ⚡ Functionality & APIs
- **Custom React Hooks** (`useAuth`, `useIsMobile`, `useToast`)
- **Utility Functions** (class merging, CSV export, etc.)
- **Firebase Services** (project management, authentication)
- **AI Integration** (GenKit flows, task suggestions)
- **Type Definitions** (Task, User, Project models)

#### 🎯 Development Guidelines
- Code organization patterns
- TypeScript best practices
- Testing strategies
- Performance optimization
- Security considerations

## 🔍 Quick Reference

### Component Categories

| Category | Components | Documentation |
|----------|------------|---------------|
| **Form Controls** | Button, Input, Select, Textarea, Checkbox | [Component Guide](./COMPONENT_GUIDE.md#ui-components) |
| **Layout** | Card, Dialog, Sheet, Tabs, Accordion | [Component Guide](./COMPONENT_GUIDE.md#layout-components) |
| **Data Display** | Table, Badge, Progress, Avatar | [Component Guide](./COMPONENT_GUIDE.md#data-display-components) |
| **Navigation** | Menubar, Dropdown, Popover, Tooltip | [API Reference](./API_REFERENCE.md#ui-components) |
| **App-Specific** | Dashboard, TaskCard, ProjectSidebar | [Component Guide](./COMPONENT_GUIDE.md#app-specific-components) |

### Key APIs

| API | Purpose | Documentation |
|-----|---------|---------------|
| `useAuth()` | Authentication state management | [Hooks Docs](./HOOKS_DOCUMENTATION.md#useauth) |
| `useIsMobile()` | Responsive design utility | [Hooks Docs](./HOOKS_DOCUMENTATION.md#useismobile) |
| `useToast()` | Notification system | [Hooks Docs](./HOOKS_DOCUMENTATION.md#usetoast) |
| `getProjectWithTasks()` | Project data fetching | [API Reference](./API_REFERENCE.md#services) |
| `suggestUpdates()` | AI-powered task suggestions | [API Reference](./API_REFERENCE.md#ai-flows) |

### Type Definitions

| Type | Description | Documentation |
|------|-------------|---------------|
| `Task` | Core task entity with status, priority, assignments | [API Reference](./API_REFERENCE.md#task) |
| `User` | User entity with role-based permissions | [API Reference](./API_REFERENCE.md#user) |
| `Priority` | Task priority levels (High, Medium, Low) | [API Reference](./API_REFERENCE.md#priority) |
| `Status` | Task status workflow states | [API Reference](./API_REFERENCE.md#status) |

## 🛠️ Development Workflow

### For New Features

1. **Read**: [Getting Started Guide](./GETTING_STARTED.md) for project setup
2. **Reference**: [API Reference](./API_REFERENCE.md) for existing patterns
3. **Implement**: Follow [Component Guide](./COMPONENT_GUIDE.md) for UI development
4. **Test**: Use [Hooks Documentation](./HOOKS_DOCUMENTATION.md) for state management

### For Bug Fixes

1. **Understand**: Use [API Reference](./API_REFERENCE.md) to understand affected components
2. **Debug**: Follow troubleshooting guides in [Getting Started](./GETTING_STARTED.md)
3. **Fix**: Apply patterns from [Component Guide](./COMPONENT_GUIDE.md)

### For Code Review

1. **Standards**: Check against [Getting Started](./GETTING_STARTED.md) best practices
2. **Patterns**: Verify consistency with [Component Guide](./COMPONENT_GUIDE.md) examples
3. **APIs**: Ensure proper usage per [API Reference](./API_REFERENCE.md)

## 🎯 Common Use Cases

### Building Forms
```typescript
// See Component Guide for complete examples
import { Button, Input, Select } from '@/components/ui'
import { useToast } from '@/hooks/use-toast'
```
→ **[Form Examples](./COMPONENT_GUIDE.md#form-components)**

### Authentication
```typescript
import { useAuth } from '@/hooks/use-auth'
const { user, loading } = useAuth()
```
→ **[Auth Documentation](./HOOKS_DOCUMENTATION.md#authentication-hooks)**

### Responsive Design
```typescript
import { useIsMobile } from '@/hooks/use-mobile'
const isMobile = useIsMobile()
```
→ **[Responsive Patterns](./HOOKS_DOCUMENTATION.md#ui-hooks)**

### AI Integration
```typescript
import { suggestUpdates } from '@/ai/flows/suggest-updates'
```
→ **[AI Documentation](./API_REFERENCE.md#ai-flows)**

## 📊 Project Statistics

- **🧩 Components**: 37+ documented UI components
- **🔗 Hooks**: 3 custom React hooks with comprehensive examples
- **⚡ Functions**: 10+ utility functions and services
- **🤖 AI Features**: GenKit integration with Gemini AI
- **📱 Responsive**: Mobile-first design with responsive components
- **♿ Accessible**: ARIA-compliant components with keyboard navigation

## 🤝 Contributing

### Documentation Updates

When adding new features:

1. **Update API Reference** for new functions/components
2. **Add Component Examples** to the Component Guide
3. **Document Custom Hooks** if creating reusable logic
4. **Update Getting Started** for new setup requirements

### Code Standards

- **TypeScript**: All code must be properly typed
- **Components**: Follow the established patterns in Component Guide
- **Hooks**: Use patterns from Hooks Documentation
- **Testing**: Include examples and test cases

## 🆘 Getting Help

### Quick Solutions

| Issue | Solution |
|-------|----------|
| Component not working | Check [Component Guide](./COMPONENT_GUIDE.md) examples |
| TypeScript errors | Review [API Reference](./API_REFERENCE.md) type definitions |
| Authentication issues | See [Hooks Documentation](./HOOKS_DOCUMENTATION.md#useauth) |
| Setup problems | Follow [Getting Started](./GETTING_STARTED.md) setup guide |

### Documentation Feedback

Found an issue or need clarification? The documentation is continuously improved based on developer feedback.

---

## 📄 License & Contact

This documentation is part of the ProjectPulse project. For questions about implementation details, refer to the specific documentation files linked above.

**Happy coding! 🚀**