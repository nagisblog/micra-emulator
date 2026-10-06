import { defineConfig } from 'vitest/config';

// GitHub Pages (project site) は https://nagisblog.github.io/micra-emulator/ で配信されるため base を合わせる
export default defineConfig({
  base: '/micra-emulator/',
  test: {
    environment: 'node',
  },
});
