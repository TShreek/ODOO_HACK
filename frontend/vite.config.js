import { defineConfig } from 'vite'

// Dynamic/optional import so dev server still runs if plugin missing
async function getReactPlugin() {
  try {
    const mod = await import('@vitejs/plugin-react');
    return mod.default();
  } catch (e) {
    console.warn('[vite] @vitejs/plugin-react not installed; continuing without React fast refresh');
    return null;
  }
}

export default defineConfig(async () => {
  const react = await getReactPlugin();
  return {
    plugins: react ? [react] : [],
    server: {
      port: 5173
    }
  };
});
