# @sis-thesqd/mmq

A reusable React component for managing task queues with drag-and-drop functionality, built with React, Next.js, and TypeScript.

## Installation

First, configure npm to use GitHub Packages. Create or edit `.npmrc` in your project root:

```
@sis-thesqd:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

Then install the package:

```bash
npm install @sis-thesqd/mmq
```

## Quick Start

### 1. Install and import the component

```tsx
import { MMQ } from '@sis-thesqd/mmq';
import '@sis-thesqd/mmq/styles.css';

export default function MyPage() {
  return (
    <MMQ
      accountNumber={12345}
      supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!}
      supabaseKey={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}
    />
  );
}
```

### 2. Configure environment variables

Add these to your `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

That's it! **No API routes needed** - the component makes all API calls directly to Supabase and the backend webhooks.

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
import '@sis-thesqd/mmq/styles.css';

export default function MyPage() {
  return (
    <MMQ
      accountNumber={12345}
      supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!}
      supabaseKey={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}
    />
  );
}
```

### Advanced Usage with Props

```tsx
import { MMQ } from '@sis-thesqd/mmq';
import '@sis-thesqd/mmq/styles.css';

export default function Page() {
  return (
    <MMQ
      accountNumber={12345}
      supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!}
      supabaseKey={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}
      showAccountOverride={true}
      showTitle={true}
      title="My Custom Queue"
      reorderEndpoint="https://custom.com/reorder" // optional
      playPauseEndpoint="https://custom.com/play-pause" // optional
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

All API calls are made directly from the package - no Next.js API routes required!

## Component Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `accountNumber` | `number` | Yes | - | Account number to load queue data for |
| `supabaseUrl` | `string` | Yes | - | Supabase project URL for API calls |
| `supabaseKey` | `string` | Yes | - | Supabase anonymous key for authentication |
| `reorderEndpoint` | `string` | No | Default webhook | Custom endpoint for reorder API calls |
| `playPauseEndpoint` | `string` | No | Default webhook | Custom endpoint for play/pause API calls |
| `showAccountOverride` | `boolean` | No | `false` | Show account override controls |
| `showTitle` | `boolean` | No | `true` | Show the component title |
| `title` | `string` | No | `"Manage My Queue"` | Custom title text |
| `darkMode` | `boolean` | No | `false` | Enable dark mode |
| `showCountdownTimers` | `boolean` | No | `false` | Show countdown timers for tasks |
| `onError` | `(error: Error \| string) => void` | No | - | Callback when an error occurs |
| `onDataLoaded` | `(data: TaskResponse) => void` | No | - | Callback when data is successfully loaded |
| `onChangesApplied` | `() => void` | No | - | Callback when changes are applied |

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file:
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

3. Run the development server:
```bash
npm run dev
```

4. View the demo page:
```bash
# Navigate to http://localhost:3000/demo?accountNumber=12345
```

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

The following environment variables are required:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

Add these to your `.env.local` file for local development, or configure them in your deployment platform (Vercel, Netlify, etc.).

## How It Works

The MMQ component makes API calls directly to:
1. **Supabase** - for fetching queue data via RPC function `get_combined_account_data`
2. **Backend Webhooks** - for reordering tasks and play/pause actions

**No Next.js API routes required!** All API calls are bundled within the package.

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

