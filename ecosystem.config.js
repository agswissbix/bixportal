module.exports = {
  apps: [
    {
      name: "bixportal",
      script: "server.js",
      instances: 2, // Si può aumentare a Max se si vuole più performance
      exec_mode: "cluster", 
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};