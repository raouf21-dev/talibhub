// ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'talib-backend',
      script: 'server.js',
      cwd: '/home/project/TalibHub/Back-End',
      instances: 1,
      exec_mode: 'fork', // Utilisation du mode fork pour une instance unique
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      // Configuration par défaut (pour le développement par exemple)
      env: {
        NODE_ENV: 'development',
        PORT: 4000,
        // Ajoutez ici d'autres variables pour le développement si nécessaire
      },
      // Configuration spécifique à la production
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
        // Ajoutez ici d'autres variables pour la production
      },
    },
  ],
};
