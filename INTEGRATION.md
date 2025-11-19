# MMQ Module Federation Integration Guide

Enterprise-grade guide for integrating MMQ into any Vite application.

## Quick Start (3 Steps)

### 1. Install Dependencies

```bash
npm install @module-federation/vite
```

### 2. Configure Vite

Copy this into your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { federation } from '@module-federation/vite'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'yourApp',
      remotes: {
        mmq: 'mmq@https://mmq-modular.vercel.app/_next/static/chunks/remoteEntry.js',
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
      },
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://mmq-modular.vercel.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
```

### 3. Use in Your App

```tsx
import { lazy, Suspense } from 'react'

const MMQ = lazy(() => import('mmq/MMQDemo'))

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MMQ accountNumber={2800} />
    </Suspense>
  )
}
```

That's it! You now have a fully functional MMQ component.

---

## Advanced Configuration

### Option 1: Using the Custom Hook (Recommended)

```tsx
import { useMMQ } from '@sis-thesqd/mmq'

function App() {
  const MMQ = useMMQ({
    accountNumber: 2800,
    autoDetectAccount: true, // Auto-detect from URL params
    fallback: <div>Loading MMQ...</div>,
  })

  return <MMQ />
}
```

### Option 2: With Custom Configuration

```tsx
import { lazy, Suspense } from 'react'

const MMQ = lazy(() => import('mmq/MMQDemo'))

function App() {
  const accountNumber = parseInt(
    new URLSearchParams(window.location.search).get('accountNumber') || '2800',
    10
  )

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MMQ accountNumber={accountNumber} />
    </Suspense>
  )
}
```

---

## Environment-Specific Configuration

### Development

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    react(),
    federation({
      remotes: {
        mmq: 'mmq@http://localhost:3004/_next/static/chunks/remoteEntry.js',
      },
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3004',
        changeOrigin: true,
      },
    },
  },
})
```

### Production

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    react(),
    federation({
      remotes: {
        mmq: 'mmq@https://mmq-modular.vercel.app/_next/static/chunks/remoteEntry.js',
      },
    }),
  ],
})
```

### Using Environment Variables

```typescript
// vite.config.ts
const MMQ_REMOTE_URL =
  import.meta.env.VITE_MMQ_REMOTE_URL || 'https://mmq-modular.vercel.app'

export default defineConfig({
  plugins: [
    react(),
    federation({
      remotes: {
        mmq: `mmq@${MMQ_REMOTE_URL}/_next/static/chunks/remoteEntry.js`,
      },
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: MMQ_REMOTE_URL,
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
```

Then in your `.env` files:

```bash
# .env.development
VITE_MMQ_REMOTE_URL=http://localhost:3004

# .env.production
VITE_MMQ_REMOTE_URL=https://mmq-modular.vercel.app
```

---

## Troubleshooting

### CSS Not Loading

If styles aren't loading, manually add the CSS link to your `index.html`:

```html
<head>
  <link
    rel="stylesheet"
    href="https://mmq-modular.vercel.app/_next/static/css/app.css"
  />
</head>
```

Or dynamically load it:

```tsx
useEffect(() => {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = 'https://mmq-modular.vercel.app/_next/static/css/app.css'
  document.head.appendChild(link)

  return () => document.head.removeChild(link)
}, [])
```

### API Calls Failing

Ensure your Vite proxy is configured correctly:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'https://mmq-modular.vercel.app',
      changeOrigin: true,
      secure: true,
      rewrite: (path) => path, // Don't rewrite paths
    },
  },
}
```

### Browser Cache Issues

If you see old data after a deployment:

1. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+F5` (Windows)
2. Clear cache: Settings → Privacy → Clear browsing data
3. Use incognito mode for testing

---

## TypeScript Support

Add type declarations for the remote module:

```typescript
// src/types/mmq.d.ts
declare module 'mmq/MMQDemo' {
  import { ComponentType } from 'react'

  export interface MMQProps {
    accountNumber?: number
  }

  const MMQDemo: ComponentType<MMQProps>
  export default MMQDemo
}
```

---

## Performance Optimization

### Preload the Remote Module

```tsx
import { useEffect } from 'react'

function App() {
  useEffect(() => {
    // Preload MMQ module
    import('mmq/MMQDemo')
  }, [])

  // ... rest of component
}
```

### Code Splitting by Route

```tsx
import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

const MMQPage = lazy(() =>
  import('./pages/MMQPage').then(module => ({
    default: () => {
      const MMQ = lazy(() => import('mmq/MMQDemo'))
      return (
        <Suspense fallback={<div>Loading...</div>}>
          <MMQ accountNumber={2800} />
        </Suspense>
      )
    },
  }))
)

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/mmq" element={<MMQPage />} />
      </Routes>
    </BrowserRouter>
  )
}
```

---

## Security Best Practices

### 1. API Endpoint Configuration

Always proxy API calls through your own backend or use the provided serverless functions:

```typescript
// ✅ Good - Uses proxy
fetch('/api/mmq-queue-data?accountNumber=2800')

// ❌ Bad - Exposes credentials
fetch('https://your-supabase.co/rest/v1/rpc/...')
```

### 2. Content Security Policy

Add CSP headers for remote module loading:

```html
<meta
  http-equiv="Content-Security-Policy"
  content="script-src 'self' https://mmq-modular.vercel.app; style-src 'self' 'unsafe-inline' https://mmq-modular.vercel.app;"
/>
```

### 3. Subresource Integrity (SRI)

For production, consider SRI hashes for the remote entry:

```typescript
federation({
  remotes: {
    mmq: {
      entry: 'https://mmq-modular.vercel.app/_next/static/chunks/remoteEntry.js',
      integrity: 'sha384-...', // Add SRI hash
    },
  },
})
```

---

## Production Checklist

- [ ] Environment variables configured
- [ ] API proxy set up
- [ ] CSS loading working
- [ ] Error boundaries in place
- [ ] TypeScript types added
- [ ] Module Federation configured
- [ ] Hard refresh tested
- [ ] Network tab shows no Supabase calls
- [ ] Performance profiled
- [ ] CSP headers configured

---

## Support

For issues or questions:

- GitHub Issues: https://github.com/sis-thesqd/mmq/issues
- Documentation: https://mmq-modular.vercel.app/docs
- Email: support@thesqd.com
