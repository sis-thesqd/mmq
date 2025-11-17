# @sis-thesqd/mmq

A reusable React component for managing task queues with drag-and-drop functionality, built with React, Next.js, and TypeScript.

## Installation

```bash
npm install @sis-thesqd/mmq
```

## Quick Start (2-4 Lines)

```tsx
import { MMQ } from '@sis-thesqd/mmq';
import '@sis-thesqd/mmq/styles';

export default function MyPage() {
  return <MMQ accountNumber={12345} />;
}
```

That's it! The component includes built-in API routes that work automatically with Next.js.

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **DND Kit** - Drag and drop functionality
- **Supabase** - Backend database

## Setup for Development

```bash
# Install dependencies
npm install

# Set up environment variables (see ENV_SETUP.md)
# Create .env.local with your Supabase credentials

# Run development server
npm run dev
```

Open http://localhost:3000/demo?accountNumber=2800 to view the demo.

## Usage

### Basic Usage

```tsx
import { MMQ } from '@sis-thesqd/mmq';
import '@sis-thesqd/mmq/styles';

export default function MyPage() {
  return <MMQ accountNumber={12345} />;
}
```

### Advanced Usage with Props

```tsx
import { MMQ } from '@sis-thesqd/mmq';
import '@sis-thesqd/mmq/styles';

export default function Page() {
  return (
    <MMQ
      accountNumber={12345}
      showAccountOverride={true}
      showTitle={true}
      title="My Custom Queue"
      onError={(error) => {
        console.error('MMQ Error:', error);
      }}
      onDataLoaded={(data) => {
        console.log('Data loaded:', data);
      }}
      onChangesApplied={() => {
        console.log('Changes applied successfully');
      }}
    />
  );
}
```

### Accessing Global Config

```tsx
import { MMQ_CONFIG, MMQ_API_ENDPOINTS } from '@sis-thesqd/mmq';

console.log('Reorder endpoint:', MMQ_API_ENDPOINTS.reorder);
console.log('Play/Pause endpoint:', MMQ_API_ENDPOINTS.playPause);
```

API routes are built-in and work automatically in both development and production!

## Component Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `accountNumber` | `number` | Yes | - | Account number to load queue data for |
| `onError` | `(error: Error) => void` | No | - | Callback when an error occurs |
| `onDataLoaded` | `(data: { church: string; account: number; tasksCount: number }) => void` | No | - | Callback when data is successfully loaded |
| `onChangesApplied` | `() => void` | No | - | Callback when changes are applied |
| `showAccountOverride` | `boolean` | No | `false` | Show account override controls |
| `className` | `string` | No | `""` | Custom className for the container |
| `showTitle` | `boolean` | No | `true` | Show the component title |
| `title` | `string` | No | `"Manage My Queue"` | Custom title text |

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file (optional - only needed if hosting API routes separately):
```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=https://your-deployed-api.com
```

If not set, API routes will use the same domain (works out of the box with Next.js).

3. Run the development server:
```bash
npm run dev
```

4. View the demo page:
```bash
# Navigate to http://localhost:3000/demo?accountNumber=12345
```

> **Note:** API routes are built-in with Next.js and work automatically in development!

## Building for Production

To build the Next.js application:

```bash
npm run build
```

To start the production server:

```bash
npm run start
```

## Environment Variables

The following environment variables are used by the API endpoints:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `NEXT_PUBLIC_SUPABASE_URL_READ_ONLY` (optional) - Read-only Supabase URL

Add these to your `.env.local` file for local development, or configure them in your deployment platform (Vercel, Netlify, etc.).

## API Routes

This Next.js application includes built-in API routes in `app/api/`:

- `/api/mmq-queue-data` - GET queue data for an account
- `/api/mmq-reorder` - PATCH reorder queued tasks
- `/api/mmq-play-pause` - PATCH play/pause a task

**Note:** The `mmq-update` API route has been removed as requested.

### How API Routes Work in Next.js

API routes in Next.js work seamlessly - just like pages! They:
- Run as serverless functions in production
- Work automatically in development with `npm run dev`
- Are deployed with your Next.js application
- Don't require any special configuration

### Deployment

When you deploy to Vercel, Netlify, or any Next.js-compatible platform:
1. API routes are automatically deployed as serverless functions
2. Set your environment variables in the platform dashboard
3. Everything works out of the box - no additional setup needed!

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_URL_READ_ONLY` (optional)

## Project Structure

- `app/` - Next.js app directory
  - `app/api/` - API routes (serverless functions)
  - `app/demo/` - Demo page
  - `app/layout.tsx` - Root layout
  - `app/page.tsx` - Home page
- `src/components/mmq/` - MMQ-specific components (layout, modals, task components)
- `src/components/mmq/MMQ.tsx` - Main MMQ component
- `src/components/ui/` - Reusable UI components (button, card, badge, etc.)
- `src/services/mmq/` - MMQ service layer (API calls, constants, utils)
- `src/types/` - TypeScript type definitions
- `src/styles/` - Global CSS and style modules
- `src/index.ts` - Package entry point (for npm publishing)

## Features

- Drag and drop task reordering
- Play/pause task functionality
- Real-time queue updates
- Account override functionality
- Responsive design
- TypeScript support
- Fully customizable props

## Demo Page

A demo page is available at `/demo` that demonstrates how to use the MMQ component with different account numbers and configurations.

Navigate to http://localhost:3000/demo?accountNumber=12345 to see it in action.

