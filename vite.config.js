import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        menu: 'menu.html',
        about: 'about.html',
        contact: 'contact.html',
        admin: 'admin.html',
        login: 'login.html',
      },
    },
  },
  server: {
    port: 5173,
    open: false,
  },
});
