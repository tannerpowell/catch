/**
* This configuration file lets you run `$ sanity [command]` in this folder
* Go to https://www.sanity.io/docs/cli to learn more.
**/
import { defineCliConfig } from 'sanity/cli'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET

// Validate required environment variables
const missingVars: string[] = []
if (!projectId) missingVars.push('NEXT_PUBLIC_SANITY_PROJECT_ID')
if (!dataset) missingVars.push('NEXT_PUBLIC_SANITY_DATASET')

if (missingVars.length > 0) {
  console.error(
    `Missing required environment variables:\n${missingVars.map(v => `  - ${v}`).join('\n')}\n\n` +
    'Please set these variables in your .env.local file or CI/CD environment.'
  )
  process.exit(1)
}

export default defineCliConfig({ api: { projectId, dataset } })
