import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import portfolioContent from "./vite-plugin-content.js";

export default defineConfig({
  plugins: [react(), portfolioContent()],
  base: "/",
});
