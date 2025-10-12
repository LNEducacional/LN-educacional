module.exports = {
  apps: [
    {
      name: 'ln-educacional-server',
      script: './server/dist/index.js',
      cwd: '/var/www/ln-educacional',
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster',
      watch: false,
      ignore_watch: ['node_modules', 'logs', '*.log'],

      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 3333,
        HOST: '0.0.0.0'
      },
      // Load full environment from .env file
      env_file: './server/.env',
      env_development: {
        NODE_ENV: 'development',
        PORT: 3333,
        HOST: '0.0.0.0'
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3333,
        HOST: '0.0.0.0'
      },

      // Logging
      error_file: './logs/server-err.log',
      out_file: './logs/server-out.log',
      log_file: './logs/server-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      log_type: 'json',

      // Auto-restart and monitoring
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      restart_delay: 4000,

      // Health monitoring
      listen_timeout: 8000,
      kill_timeout: 5000,

      // Performance monitoring
      pmx: true,
      instance_var: 'INSTANCE_ID',

      // Advanced PM2 features
      vizion: false, // Disable git metadata
      source_map_support: true,

      // Node.js specific
      node_args: '--max-old-space-size=2048 --optimize-for-size',
    },

    {
      name: 'ln-educacional-client',
      script: 'npx',
      args: 'serve -s client/dist -l 3000 --single --cors',
      cwd: '/var/www/ln-educacional',
      instances: 1,
      exec_mode: 'fork',
      watch: false,

      // Environment variables
      env: {
        NODE_ENV: 'production',
        SERVE_PORT: 3000
      },
      env_development: {
        NODE_ENV: 'development',
        SERVE_PORT: 3000
      },

      // Logging
      error_file: './logs/client-err.log',
      out_file: './logs/client-out.log',
      log_file: './logs/client-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Auto-restart and monitoring
      autorestart: true,
      max_restarts: 5,
      min_uptime: '10s',
      max_memory_restart: '512M',
      restart_delay: 2000,

      // Health monitoring
      listen_timeout: 5000,
      kill_timeout: 3000,
    }
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-production-server.com'],
      ref: 'origin/main',
      repo: 'https://github.com/your-username/ln-educacional.git',
      path: '/var/www/ln-educacional',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.cjs --env production',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no'
    },

    staging: {
      user: 'deploy',
      host: ['your-staging-server.com'],
      ref: 'origin/develop',
      repo: 'https://github.com/your-username/ln-educacional.git',
      path: '/var/www/ln-educacional-staging',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.cjs --env staging',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no'
    }
  }
};