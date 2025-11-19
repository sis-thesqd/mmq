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

## Framework-Specific Integration Examples

### Next.js App Router (Recommended)

The MMQ component uses client-side features (drag-and-drop, state management). Use the `'use client'` directive:

```tsx
// app/queue/page.tsx
'use client';

import { MMQ } from '@sis-thesqd/mmq';
import '@sis-thesqd/mmq/styles.css';

export default function QueuePage() {
  return (
    <div>
      <MMQ
        accountNumber={12345}
        supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!}
        supabaseKey={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}
        showAccountOverride={true}
      />
    </div>
  );
}
```

### Next.js Pages Router

```tsx
// pages/queue.tsx
import { MMQ } from '@sis-thesqd/mmq';
import '@sis-thesqd/mmq/styles.css';

export default function QueuePage() {
  return (
    <MMQ
      accountNumber={12345}
      supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!}
      supabaseKey={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}
    />
  );
}
```

### Create React App

```tsx
// src/App.tsx
import { MMQ } from '@sis-thesqd/mmq';
import '@sis-thesqd/mmq/styles.css';

function App() {
  return (
    <div className="App">
      <MMQ
        accountNumber={12345}
        supabaseUrl={process.env.REACT_APP_SUPABASE_URL!}
        supabaseKey={process.env.REACT_APP_SUPABASE_ANON_KEY!}
      />
    </div>
  );
}

export default App;
```

**Note**: Create React App uses `REACT_APP_` prefix for environment variables.

### Vite + React

```tsx
// src/App.tsx
import { MMQ } from '@sis-thesqd/mmq';
import '@sis-thesqd/mmq/styles.css';

function App() {
  return (
    <MMQ
      accountNumber={12345}
      supabaseUrl={import.meta.env.VITE_SUPABASE_URL}
      supabaseKey={import.meta.env.VITE_SUPABASE_ANON_KEY}
    />
  );
}

export default App;
```

**Note**: Vite uses `VITE_` prefix and `import.meta.env` for environment variables.

### With Error Handling

```tsx
'use client';

import { MMQ } from '@sis-thesqd/mmq';
import '@sis-thesqd/mmq/styles.css';
import { useState } from 'react';

export default function QueuePage() {
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      )}

      <MMQ
        accountNumber={12345}
        supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!}
        supabaseKey={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}
        onError={(err) => {
          const message = err instanceof Error ? err.message : String(err);
          setError(message);
          console.error('MMQ Error:', message);
        }}
        onDataLoaded={(data) => {
          console.log(`Loaded ${data.tasks.length} tasks`);
          setError(null);
        }}
      />
    </div>
  );
}
```

## Troubleshooting

### Component doesn't render or shows blank screen

**Possible causes:**
- Missing environment variables
- Invalid account number
- Network connectivity issues
- CSS not loaded

**Solutions:**
1. Check that environment variables are set correctly:
   ```bash
   # .env.local for Next.js
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

2. Verify the CSS import is present:
   ```tsx
   import '@sis-thesqd/mmq/styles.css';
   ```

3. Open browser console to check for error messages

4. Verify account number exists in your Supabase database

### "Failed to Load Styles" error

This error appears when CSS loading times out (>10 seconds).

**Solutions:**
- Check your network connection
- Verify the package is correctly installed: `npm list @sis-thesqd/mmq`
- Try clearing your browser cache
- Click the "Retry" button in the error UI

### TypeScript errors about missing types

**Solution:** Install type definitions and ensure your `tsconfig.json` includes:
```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "jsx": "react-jsx"
  }
}
```

### Drag and drop not working

**Possible causes:**
- Component not marked as client-side in Next.js App Router
- Touch device without proper event listeners

**Solutions:**
1. For Next.js App Router, add `'use client'` directive
2. Ensure you're not wrapping the component in any conflicting drag-drop contexts
3. Check browser console for errors

### Styles not applying correctly

**Solutions:**
1. Ensure CSS is imported **after** the component import:
   ```tsx
   import { MMQ } from '@sis-thesqd/mmq';
   import '@sis-thesqd/mmq/styles.css'; // Import CSS after component
   ```

2. If using Tailwind CSS, ensure the MMQ styles don't conflict:
   ```js
   // tailwind.config.js
   module.exports = {
     content: [
       './src/**/*.{js,ts,jsx,tsx}',
       './node_modules/@sis-thesqd/mmq/**/*.{js,ts,jsx,tsx}' // Add this
     ]
   }
   ```

### API calls failing

**Check these common issues:**
1. Supabase credentials are correct and active
2. Supabase RPC function `get_combined_account_data` exists
3. Account number exists in your database
4. Network tab shows the actual error response

### Performance issues with large task lists

**Optimizations:**
- The component already implements virtualization for large lists
- Limit the number of tasks returned from your Supabase query
- Consider pagination if you have >100 tasks

### Error Boundary catches an error

The component includes an error boundary that prevents crashes. When you see the error UI:

1. Check the error details (click to expand)
2. Click "Reload Page" to recover
3. Check browser console for full error stack
4. Verify all props are valid
5. Check that Supabase credentials are correct

If errors persist, please open an issue with:
- Error message and stack trace
- Browser and version
- Framework and version (Next.js, React, etc.)
- Steps to reproduce

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

A demo page is available at `/demo` that demonstrates how to use the MMQ component with different account numbers and configurations.

Navigate to http://localhost:3000/demo?accountNumber=12345 to see it in action.

