# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` - Starts Next.js development server on port 3000
- **Build**: `npm run build` - Creates production build
- **Production server**: `npm start` - Starts production server
- **Linting**: `npm run lint` - Runs ESLint with Next.js TypeScript rules

## Project Architecture

This is a Next.js 15 chat application built with React 19, TypeScript, and Tailwind CSS. The application uses the App Router and implements a modern chat interface.

### Key Architecture Components

- **UI Framework**: Built with shadcn/ui components using Radix UI primitives
- **Styling**: Tailwind CSS v4 with CSS variables for theming
- **Chat System**: Custom prompt-kit components for chat interface
- **Layout**: Sidebar-based layout with collapsible navigation using shadcn/ui Sidebar

### Directory Structure

- `app/` - Next.js App Router pages and layouts
- `components/` - React components organized by feature:
  - `prompt-kit/` - Chat-specific components (messages, input, containers)
  - `ui/` - shadcn/ui base components
  - `primitives/` - Custom primitive components
- `lib/` - Utility functions (primarily `cn()` for class merging)
- `hooks/` - Custom React hooks

### Key Files

- `components/chat-app.tsx` - Main chat application component with sidebar and message handling
- `components/prompt-kit/` - Contains reusable chat components like ChatContainer, Message, PromptInput
- `components.json` - shadcn/ui configuration with New York style and Lucide icons
- `lib/utils.ts` - Utility functions using clsx and tailwind-merge

### Component Patterns

- Uses compound component patterns for chat containers and messages
- Implements responsive design with mobile-first approach
- Follows shadcn/ui conventions for component composition and styling
- Uses TypeScript strict mode with path aliasing (`@/` maps to root)

### Agentbase Integration

This application integrates with the Agentbase SDK for AI agent interactions:

- **SDK Client**: `lib/agentbase-client.ts` - Wrapper around Agentbase SDK
- **Response Handling**: Maps SDK response types to UI components:
  - `agent_started` → Session initialization (not displayed)
  - `agent_thinking` → Blue thinking bubbles with brain icon
  - `agent_tool_use` → Orange tool usage indicators with wrench icon
  - `agent_tool_response` → Green tool result indicators with checkmark
  - `agent_response` → Standard assistant messages with markdown
  - `agent_cost` → Purple cost tracking with dollar icon
- **Session Management**: Persistent conversations with session ID tracking
- **Message History**: Full conversation replay via `getMessages` API
- **Chat Controls**: New chat, clear history, session display

### Environment Setup

Create a `.env.local` file in the project root with your Agentbase API key:

```
AGENTBASE_API_KEY=your-api-key-here
```

The `.env.local` file is already included in `.gitignore` to keep your API key secure and out of version control.

### Dependencies Notes

- **AI SDK**: Agentbase SDK for agent interactions
- **UI**: Radix UI primitives with shadcn/ui wrapper components
- **Markdown**: Uses `react-markdown` with `remark-gfm` and `remark-breaks`
- **Code Highlighting**: Uses `shiki` for syntax highlighting
- **Chat Behavior**: Uses `use-stick-to-bottom` for auto-scrolling chat
- **Icons**: Lucide React for consistent iconography