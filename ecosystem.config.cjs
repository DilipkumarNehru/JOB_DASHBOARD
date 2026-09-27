module.exports = {
  apps: [
    {
      name: "job-dashboard-backend",
      cwd: "./backend",
      script: "./src/server.js",
      interpreter: "node",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "development"
      }
    },
    {
      name: "job-dashboard-frontend",
      cwd: "./frontend",
      script: "./node_modules/vite/bin/vite.js",
      interpreter: "node",
      args: "--host 0.0.0.0",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "development"
      }
    }
  ]
};