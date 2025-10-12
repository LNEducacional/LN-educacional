module.exports = {
  apps: [
    {
      name: 'ln-educacional-server-dev',
      script: 'npm',
      args: 'run dev:server',
      cwd: '/var/www/ln-educacional',
      interpreter: 'node',
      env: {
        NODE_ENV: 'development',
        PORT: 3333,
        HOST: '0.0.0.0',
      },
      watch: false,
      autorestart: true,
      max_memory_restart: '1G',
    },
    {
      name: 'ln-educacional-client-dev',
      script: 'npm',
      args: 'run dev:client',
      cwd: '/var/www/ln-educacional',
      interpreter: 'node',
      env: {
        NODE_ENV: 'development',
      },
      watch: false,
      autorestart: true,
      max_memory_restart: '1G',
    },
  ],
};




