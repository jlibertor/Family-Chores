import { spawnSync } from 'node:child_process'

const apiBaseUrl = 'https://family-chores-api.jlibertor.workers.dev'

function run(command, options = {}) {
  const result = spawnSync(command, {
    stdio: 'inherit',
    shell: true,
    ...options,
  })

  if (result.error) {
    console.error(result.error.message)
    process.exit(1)
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

run('npm run deploy:worker')

run('npm --workspace frontend run build', {
  env: {
    ...process.env,
    VITE_API_BASE_URL: apiBaseUrl,
  },
})

run('npx wrangler pages deploy frontend/dist --project-name family-chores --branch main --commit-dirty=true')
