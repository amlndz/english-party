export default {
  build: { target: 'es2022' },
  server: {
    watch: { usePolling: true, interval: 300 },
    proxy: { '/ws': { target: 'ws://localhost:3001', ws: true }, '/api': { target: 'http://localhost:3001' } },
  },
};
