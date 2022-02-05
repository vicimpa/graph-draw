import { defineConfig } from "vite";
import paths from "vite-tsconfig-paths";

export default defineConfig({
  base: '/',
  publicDir: './public',
  plugins: [paths()]
});