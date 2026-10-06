import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Las pruebas de integración usan Postgres real y SMTP real (Gmail),
    // cada envío puede tardar varios segundos.
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
