'use strict'
/**
 * macOS Gatekeeper quarantine blocks downloaded native addons (fsevents, Prisma, SWC, lightningcss, …).
 * Strip quarantine + ad-hoc sign so Node can load them in dev.
 *
 * - Every *.node under node_modules (npm-installed native modules)
 * - *.dylib only under known paths (Prisma, etc.) to avoid touching unrelated libs
 */
const { execFileSync } = require('child_process')
const path = require('path')

if (process.platform !== 'darwin') process.exit(0)

const nodeModules = path.join(__dirname, '..', 'node_modules')

function runQuiet(cmd, args) {
  try {
    execFileSync(cmd, args, { stdio: 'ignore' })
  } catch {}
}

function findFiles(pattern) {
  try {
    return execFileSync('/usr/bin/find', [nodeModules, '-name', pattern], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    })
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

function shouldDequarantineDylib(absPath) {
  const lower = absPath.toLowerCase()
  return (
    lower.includes('.prisma') ||
    lower.includes('query_engine') ||
    lower.includes('@prisma') ||
    lower.includes('lightningcss')
  )
}

const seen = new Set()
for (const file of findFiles('*.node')) {
  if (seen.has(file)) continue
  seen.add(file)
  runQuiet('/usr/bin/xattr', ['-dr', 'com.apple.quarantine', file])
  runQuiet('/usr/bin/codesign', ['--sign', '-', '--force', file])
}

for (const file of findFiles('*.dylib')) {
  if (!shouldDequarantineDylib(file)) continue
  if (seen.has(file)) continue
  seen.add(file)
  runQuiet('/usr/bin/xattr', ['-dr', 'com.apple.quarantine', file])
  runQuiet('/usr/bin/codesign', ['--sign', '-', '--force', file])
}
