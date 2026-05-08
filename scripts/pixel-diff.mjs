#!/usr/bin/env node
/**
 * Compare a Claude Artifact reference against the actual rendering.
 *
 *   claude-export/<route>.png   vs   screenshots/<route>/1280-light.png
 *
 * The goal is *structural drift detection*, not pixel-perfection. The threshold
 * is loose by default — we only want to surface "this looks like a different layout".
 *
 * Run: pnpm design:pixel-diff [--route /] [--threshold 0.1] [--max-mismatch 0.05]
 *
 * Exits non-zero if mismatch ratio > max-mismatch. Diff PNG written to diff/<route>.png.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'

const ROOT = resolve(fileURLToPath(import.meta.url), '../..')
const EXPORT_DIR = resolve(ROOT, 'claude-export')
const SHOTS_DIR = resolve(ROOT, 'screenshots')
const DIFF_DIR = resolve(ROOT, 'diff')

const args = process.argv.slice(2)
function flag(name, fallback) {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : fallback
}
const route = flag('route') // optional; if omitted, diff every PNG in claude-export/
const threshold = Number(flag('threshold', '0.1'))
const maxMismatch = Number(flag('max-mismatch', '0.05'))

function safeRouteName(r) {
  if (r === '/') return 'root'
  return r.replace(/^\//, '').replace(/[/?#&=]/g, '_')
}

function loadPNG(path) {
  return PNG.sync.read(readFileSync(path))
}

function resizeToMatch(refPng, actualPng) {
  // pixelmatch requires identical dimensions. Pad/crop the smaller of each axis.
  const width = Math.min(refPng.width, actualPng.width)
  const height = Math.min(refPng.height, actualPng.height)
  const crop = (src) => {
    if (src.width === width && src.height === height) return src
    const out = new PNG({ width, height })
    PNG.bitblt(src, out, 0, 0, width, height, 0, 0)
    return out
  }
  return [crop(refPng), crop(actualPng), width, height]
}

function diffOne(routeName) {
  const refPath = resolve(EXPORT_DIR, `${routeName}.png`)
  const actualPath = resolve(SHOTS_DIR, routeName, '1280-light.png')
  if (!existsSync(refPath)) {
    console.log(`  skip ${routeName}: no reference at ${refPath}`)
    return null
  }
  if (!existsSync(actualPath)) {
    console.error(`  fail ${routeName}: missing ${actualPath} — run design:screenshot first`)
    return { routeName, status: 'missing_actual' }
  }

  const refPng = loadPNG(refPath)
  const actualPng = loadPNG(actualPath)
  const [a, b, width, height] = resizeToMatch(refPng, actualPng)
  const out = new PNG({ width, height })
  const mismatched = pixelmatch(a.data, b.data, out.data, width, height, {
    threshold,
    includeAA: false,
  })
  const total = width * height
  const ratio = mismatched / total

  mkdirSync(DIFF_DIR, { recursive: true })
  const diffPath = resolve(DIFF_DIR, `${routeName}.png`)
  writeFileSync(diffPath, PNG.sync.write(out))

  const status = ratio > maxMismatch ? 'fail' : 'pass'
  const pct = (ratio * 100).toFixed(2)
  console.log(
    `  ${status} ${routeName}: ${pct}% mismatch (${mismatched}/${total} px) → ${diffPath}`,
  )
  return { routeName, status, ratio }
}

const targets = route
  ? [safeRouteName(route)]
  : existsSync(EXPORT_DIR)
    ? readdirSync(EXPORT_DIR)
        .filter((f) => f.endsWith('.png'))
        .map((f) => f.replace(/\.png$/, ''))
    : []

if (targets.length === 0) {
  console.log('No reference images found in claude-export/. Drop a <route>.png there.')
  process.exit(0)
}

const results = targets.map(diffOne).filter(Boolean)
const failed = results.filter((r) => r.status !== 'pass')
if (failed.length > 0) {
  console.error(
    `\n❌ ${failed.length} route(s) exceeded ${(maxMismatch * 100).toFixed(0)}% mismatch threshold`,
  )
  process.exit(1)
}
console.log('\n✓ all diffs within threshold')
