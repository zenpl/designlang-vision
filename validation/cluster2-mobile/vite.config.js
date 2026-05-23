// Minimal Vite config for the validation sandbox.
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: { port: 5174, strictPort: true },
});
