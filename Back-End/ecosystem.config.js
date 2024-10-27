// ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'talib-backend',
      script: 'server.js',
      cwd: '/home/project/TalibHub/Back-End',
      instances: 1,
      exec_mode: 'fork', // Indique à PM2 d'utiliser le mode fork
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Ajoutez d'autres variables d'environnement si nécessaire
      },
    },
  ],
};
