// ecosystem.config.js

module.exports = {
  apps: [
    {
      name: "server",
      script: "server.js",
      cwd: "/var/www/TalibHub/Back-End",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 4000,
      },
    },
  ],
};
