module.exports = {
  apps: [
    {
      name: 'NuxtAppName',
      port: '1157',
      interpreter: 'bun', // Bun interpreter
      interpreter_args: '--env-file=.env',

      env: {
        PATH: `${process.env.HOME}/.bun/bin:${process.env.PATH}`, // Add "~/.bun/bin/bun" to PATH
        PORT: '1157'
      },

      exec_mode: 'cluster',
      instances: 'max',
      script: './.output/server/index.mjs'
    }
  ]
}
