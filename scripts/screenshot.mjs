#!/usr/bin/env node
/**
 * Capture multi-viewport screenshots of running routes.
 * Used by the visual reviewer to compare against the Claude design.
 *
 * Run: pnpm design:screenshot --routes /,/activities [--base http://localhost:3000]
 *
 * Assumes a dev server is reachable. Boots `pnpm dev` itself if --start is passed.
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const ROOT = resolve(fileURLToPath(import.meta.url), '../..')
const OUT_DIR = resolve(ROOT, 'screenshots')

const args = process.argv.slice(2)
function flag(name) {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}
const routes = (flag('routes') ?? '/')
  .split(',')
  .map((r) => r.trim())
  .filter(Boolean)
const base = flag('base') ?? 'http://localhost:3000'
const shouldStart = args.includes('--start')

const VIEWPORTS = [
  { name: '375', width: 375, height: 800 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 800 },
]
const THEMES = ['light', 'dark']

function safeRouteName(route) {
  if (route === '/') return 'root'
  return route.replace(/^\//, '').replace(/[/?#&=]/g, '_')
}

async function waitForServer(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { method: 'HEAD' })
      if (res.ok || res.status < 500) return
    } catch {}
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`Dev server at ${url} did not respond within ${timeoutMs}ms`)
}

let devProc = null
if (shouldStart) {
  console.log('→ booting pnpm dev')
  devProc = spawn('pnpm', ['dev'], { cwd: ROOT, stdio: 'ignore', detached: true })
  await waitForServer(base)
}

const browser = await chromium.launch()
try {
  for (const route of routes) {
    const routeName = safeRouteName(route)
    const dir = resolve(OUT_DIR, routeName)
    mkdirSync(dir, { recursive: true })

    for (const theme of THEMES) {
      for (const vp of VIEWPORTS) {
        const ctx = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          colorScheme: theme,
        })
        const page = await ctx.newPage()
        const url = new URL(route, base).toString()
        await page.goto(url, { waitUntil: 'networkidle' })
        // next-themes uses class on <html>; force the theme class for deterministic capture.
        await page.evaluate((t) => {
          document.documentElement.classList.toggle('dark', t === 'dark')
        }, theme)
        await page.waitForTimeout(200)
        const file = resolve(dir, `${vp.name}-${theme}.png`)
        await page.screenshot({ path: file, fullPage: true })
        await ctx.close()
        console.log(`  ${routeName}/${vp.name}-${theme}.png`)
      }
    }
  }
} finally {
  await browser.close()
  if (devProc) {
    try {
      process.kill(-devProc.pid)
    } catch {}
  }
}

console.log(`\n✓ screenshots written to ${OUT_DIR}`)
