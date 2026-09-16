import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function githubPagesBase(): string {
  if (process.env.GITHUB_ACTIONS !== "true") return "/";

  const repo = process.env.GITHUB_REPOSITORY?.split("/")[1];
  if (!repo) return "/";

  // USER.github.io repositories are served from the root.
  // Ordinary project repositories are served from /REPO/.
  return repo.endsWith(".github.io") ? "/" : `/${repo}/`;
}

export default defineConfig({
  plugins: [react()],
  base: githubPagesBase(),
});
