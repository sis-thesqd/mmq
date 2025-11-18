import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: {
    compilerOptions: {
      baseUrl: '.',
      target: 'ES2020',
      paths: {
        '@/*': ['./src/*']
      }
    }
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', 'next'],
  target: 'es2020',
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";',
    };
  },
  // Process CSS with PostCSS
  async onSuccess() {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    // Build CSS with Tailwind
    await execAsync('npx tailwindcss -i ./src/styles/index.css -o ./dist/styles.css --minify');
  },
});
