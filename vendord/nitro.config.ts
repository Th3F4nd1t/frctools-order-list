import { defineNitroConfig } from 'nitropack/config'

// https://nitro.build/config
export default defineNitroConfig({
  compatibilityDate: 'latest',
  srcDir: 'server',
  imports: false,
  experimental: {
    tasks: true
  },
  scheduledTasks: {
    '0 0 * * *': 'scrape'
  }
})
