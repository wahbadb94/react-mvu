import react from "@vitejs/plugin-react";
import checker from "vite-plugin-checker";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), checker({ typescript: true })],
});
