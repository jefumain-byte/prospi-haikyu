import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const example = resolve(root, '.env.example')
const target = resolve(root, '.env')

if (existsSync(target)) {
  console.log('.env already exists:', target)
  process.exit(0)
}

copyFileSync(example, target)
console.log('Created .env from .env.example')
console.log('Edit .env, then import to Vercel: Settings > Environment Variables > Import .env')
