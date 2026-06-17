import { spawnSync } from 'node:child_process'

const apiBaseUrl = 'https://family-chores-api.jlibertor.workers.dev'
const requiredWorkerSecrets = ['PARENT_PIN']

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

function readWorkerSecrets() {
  const result = spawnSync('npx wrangler secret list --config worker/wrangler.toml', {
    encoding: 'utf8',
    shell: true,
    stdio: ['ignore', 'pipe', 'inherit'],
  })

  if (result.error) {
    console.error(result.error.message)
    process.exit(1)
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }

  try {
    return JSON.parse(result.stdout)
  } catch {
    console.error('Could not parse Worker secret list output.')
    process.exit(1)
  }
}

function verifyWorkerSecrets() {
  const secrets = readWorkerSecrets()
  const names = new Set(secrets.map((secret) => secret.name))
  const missing = requiredWorkerSecrets.filter((name) => !names.has(name))
  const hasTwilioAuthToken = names.has('TWILIO_AUTH_TOKEN')
  const hasTwilioApiKey = names.has('TWILIO_API_KEY_SID') && names.has('TWILIO_API_KEY_SECRET')

  if (missing.length > 0) {
    console.error(`Missing required Worker secret${missing.length === 1 ? '' : 's'}: ${missing.join(', ')}`)
    console.error('Set missing secrets with: npx wrangler secret put <NAME> --config worker/wrangler.toml')
    process.exit(1)
  }

  if (!hasTwilioAuthToken && !hasTwilioApiKey) {
    console.error('Missing Twilio credentials. Set TWILIO_AUTH_TOKEN or both TWILIO_API_KEY_SID and TWILIO_API_KEY_SECRET.')
    console.error('Set missing secrets with: npx wrangler secret put <NAME> --config worker/wrangler.toml')
    process.exit(1)
  }
}

verifyWorkerSecrets()

// TWILIO_ACCOUNT_SID is configured as a dashboard-managed Worker variable.
// Preserve dashboard bindings so deploys do not drop it while still keeping
// secret values out of the repository.
run('npx wrangler deploy --config worker/wrangler.toml --keep-vars')

run('npm --workspace frontend run build', {
  env: {
    ...process.env,
    VITE_API_BASE_URL: apiBaseUrl,
  },
})

run('npx wrangler pages deploy frontend/dist --project-name family-chores --branch main --commit-dirty=true')
