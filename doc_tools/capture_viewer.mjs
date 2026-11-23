// Screenshots and animated clips of the Happy Hare Console (the Visualizer web app), driven by the simulator.
//
//   node doc_tools/capture_viewer.mjs [--only NAME[,NAME...]] [--list] [--url URL] [--doc DIR]
//
// The simulator must already be running and serving the app, from a Happy Hare checkout that matches
// HAPPY_HARE_REF:   make console ARGS='--profile boxturtle2_ercf --seed 7028'
// Each recipe restarts the simulator on the profile it needs through the app's own Simulator setup panel,
// so one running simulator is enough. See doc_tools/README.md, "Photographing the Happy Hare Console".
import fs from 'fs'
import os from 'os'
import path from 'path'
import { spawnSync } from 'child_process'
import { fileURLToPath } from 'url'
import { Browser, sleep } from './viewer_cdp.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const option = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback }
const URL_BASE = option('--url', 'http://127.0.0.1:7125/sim/viewer/')
const DOC = path.resolve(option('--doc', path.join(here, '..', 'doc')))
const PYTHON = process.env.PYTHON || path.join(here, '..', 'venv', 'bin', 'python')
const WS_URL = URL_BASE.replace(/^http/, 'ws').replace(/\/sim\/viewer\/?$/, '/websocket')
const WIDTH = 1440, HEIGHT = 1040
const FIRST_CARD = 'main > section > .card'   // the scene card

// ---- the simulator's own Moonraker API, for reading state without going through the page ----
function rpc(method, params = {}) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL)
    ws.onopen = () => ws.send(JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }))
    ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id === 1) { ws.close(); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result) } }
    setTimeout(() => reject(new Error('simulator did not answer')), 180000)
  })
}
// Blocks until the simulator has finished any command it is running, then returns the mmu object's status.
const mmuStatus = async () => (await rpc('printer.objects.query', { objects: { mmu: null } })).status.mmu

class Session {
  constructor(b) { this.b = b; this.profileName = null }

  async open() {
    await this.b.goto(URL_BASE)
    await this.b.until(`/Connected/.test(document.querySelector('#connection').textContent)`, 60000)
    await sleep(1500)
  }

  // Restart the simulator on a profile (a fresh capture), tick Compress Bowden playback time, dark theme.
  async profile(name) {
    const { b } = this
    await b.eval(`(() => { const s = document.querySelector('#profiles'); s.value = ${JSON.stringify(name)}; s.dispatchEvent(new Event('change', { bubbles: true })) })()`)
    await b.click('#restart')
    await sleep(3000)
    await b.until(`/Fresh profile session started/.test(document.querySelector('#message').textContent) && /Connected/.test(document.querySelector('#connection').textContent)`, 180000)
    await sleep(3000)
    await b.eval(`(() => { const c = document.querySelector('#compress-bowden'); if (!c.checked) c.click() })()`)
    this.profileName = name
  }

  // Send a command from the page, wait for the simulator to finish it, and for the page to catch up.
  async run(command, { settle = true } = {}) {
    await this.b.eval(`(() => { const i = document.querySelector('#command'); i.value = ${JSON.stringify(command)}; document.querySelector('#command-form').requestSubmit() })()`)
    await sleep(500)
    if (settle) await this.settle()
  }

  async settle() {
    const status = await mmuStatus()
    await sleep(500)
    await this.b.until(`/Following stream/.test(document.querySelector('#mode').textContent)`, 240000)
    await sleep(1000)
    return status
  }

  // Seek to the nth trace row whose text matches.
  async seek(pattern, nth = 0) {
    const seq = await this.b.eval(`(() => {
      const rows = [...document.querySelectorAll('#trace .trace-event')].filter(r => new RegExp(${JSON.stringify(pattern)}).test(r.textContent))
      const row = rows.at(${nth}); if (!row) return null
      row.querySelector('button').click(); return Number(row.dataset.seq) })()`)
    if (seq === null) throw new Error(`no trace row matching ${pattern}`)
    await sleep(400)
    return seq
  }

  async lastSeq(pattern) {
    return this.b.eval(`(() => { const rows = [...document.querySelectorAll('#trace .trace-event')].filter(r => new RegExp(${JSON.stringify(pattern)}).test(r.textContent))
      return rows.length ? Number(rows.at(-1).dataset.seq) : null })()`)
  }

  // Play continuously from the current step until a step whose row matches `until` has been reached.
  async playUntil(untilPattern, timeout = 180000) {
    const target = await this.b.eval(`(() => { const row = [...document.querySelectorAll('#trace .trace-event')].filter(r => new RegExp(${JSON.stringify(untilPattern)}).test(r.textContent)).at(-1)
      return row ? Number(row.dataset.seq) : null })()`)
    if (target === null) throw new Error(`no trace row matching ${untilPattern}`)
    await this.b.click('#replay')
    await this.b.until(`(() => { const m = /event (\\d+)/.exec(document.querySelector('#mode').textContent); return m && Number(m[1]) >= ${target} })()`, timeout)
    await sleep(700)
  }

  async pause() {
    if (await this.b.eval(`/Playing/.test(document.querySelector('#mode').textContent)`)) await this.b.click('#replay')
    await sleep(800)
  }

  // The gates a toolchange can go to: available, and not the selected one.
  async otherGate() {
    const s = await mmuStatus()
    const gate = s.gate_status.findIndex((v, i) => v > 0 && i !== s.gate)
    if (gate < 0) throw new Error('no other available gate')
    return gate
  }

  shot(name, clip) { return this.b.screenshot(path.join(this.outDir, name), clip) }
  async shotOf(name, selector, pad = 0) {
    const r = await this.b.rect(selector)
    if (!r) throw new Error(`no element ${selector}`)
    return this.shot(name, { x: Math.max(0, r.x - pad), y: Math.max(0, r.y - pad), width: r.width + 2 * pad, height: r.height + 2 * pad })
  }

  // Record a clip of the scene card while `action()` runs.
  async clip(name, action, { scale = 0.75, fps = 10, quality = 60, hold = 1.5, selector = FIRST_CARD } = {}) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hh-clip-'))
    await this.b.eval('scrollTo(0, 0)')
    await sleep(300)
    const rect = await this.b.rect(selector)
    const frames = await this.b.record(dir, action, { quality: 70 })
    const manifest = path.join(dir, 'frames.json')
    fs.writeFileSync(manifest, JSON.stringify(frames))
    const out = path.join(this.outDir, name)
    const r = spawnSync(PYTHON, [path.join(here, 'assemble_clip.py'), manifest, out, '--crop', [rect.x, rect.y, rect.width, rect.height].join(','),
      '--scale', scale, '--fps', fps, '--quality', quality, '--hold', hold], { stdio: 'inherit' })
    if (process.env.KEEP) console.log('kept', dir); else fs.rmSync(dir, { recursive: true, force: true })
    if (r.status !== 0) throw new Error(`assemble_clip failed for ${name}`)
  }
}

// ---- numbered callouts for the layout image ----
async function addCallouts(b, items) {
  await b.eval(`(${(items, scale) => {
    const badges = []
    for (const [index, [selector, where]] of items.entries()) {
      const el = document.querySelector(selector)
      if (!el) { console.warn('no element for callout', selector); continue }
      const r = el.getBoundingClientRect()
      const [dx, dy] = where || [0, 0]
      const badge = document.createElement('div')
      badge.className = 'doc-callout'
      badge.textContent = String(index + 1)
      badge.style.cssText = `position:absolute;z-index:99999;width:26px;height:26px;border-radius:13px;background:#ff2f92;color:#fff;font:700 15px/26px sans-serif;text-align:center;box-shadow:0 0 0 2px #fff,0 2px 6px rgba(0,0,0,.5);left:${r.left + scrollX + dx - 13}px;top:${r.top + scrollY + dy - 13}px;pointer-events:none`
      document.body.append(badge); badges.push(badge)
    }
  }})(${JSON.stringify(items)})`)
}
const removeCallouts = b => b.eval(`document.querySelectorAll('.doc-callout').forEach(e => e.remove())`)

// ---- the recipes ----
// Each recipe: { out: directory under doc/, run(session) }. Clips are animated WebP; the profile named in each
// recipe is the one the image was taken on, and is part of the caption on the page.
const CONSOLE = 'Happy-Hare-Console', TELEMETRY = 'Feature-Telemetry', SIM = 'Dev-Simulator'

const tool = async (s, cutPattern, name, { to = 'gate changed', from = 'MMU_CHANGE_TOOL' } = {}) => {
  await s.run('MMU_LOAD')
  const gate = await s.otherGate()
  await s.run(`MMU_CHANGE_TOOL GATE=${gate}`)
  await s.seek(from)
  await s.clip(name, () => s.playUntil(to))
}

const recipes = {
  // -- clips: one toolchange each, replayed from the capture so it is reproducible --
  'clip-form-tip': { out: CONSOLE, run: async s => { await s.profile('boxturtle'); await tool(s, null, 'toolchange-form-tip.webp') } },
  'clip-cut-inside': { out: CONSOLE, run: async s => { await s.profile('ercf_vvd'); await tool(s, null, 'toolchange-cut-inside.webp') } },
  'clip-cut-outside': { out: CONSOLE, run: async s => { await s.profile('qidi'); await tool(s, null, 'toolchange-cut-outside.webp') } },
  'clip-mmu-cut': { out: CONSOLE, run: async s => { await s.profile('ercf_mmu_cutter'); await tool(s, null, 'toolchange-mmu-cut.webp') } },
}


const itemClick = async (s, gate, label) => {
  await s.b.click(`#scene [data-part="gate-status-pill"][data-gate="${gate}"]`)
  await sleep(1200)
  const ok = await s.b.eval(`(() => { const x = [...document.querySelectorAll('#gate-menu button')].find(e => e.textContent.trim() === ${JSON.stringify(label)}); if (!x || x.disabled) return false
    x.dataset.hit = '1'; return true })()`)
  if (!ok) throw new Error(`gate menu has no enabled ${label}`)
  await s.b.click('#gate-menu button[data-hit="1"]')
}

// Whole page in the viewport, so any element can be cropped without scrolling.
async function tall(s) { const h = await s.b.eval('document.documentElement.scrollHeight'); await s.b.setView({ width: WIDTH, height: h }); await sleep(600) }
const normal = s => s.b.setView({ width: WIDTH, height: HEIGHT })

const CALLOUTS = [
  ['#connection', [-20, 12]], ['#theme-toggle', [0, 0]], ['#connection-panel', [0, 12]], ['#sidebar-playback', [0, 12]],
  ['#tool-mapping', [0, 12]], ['#runtime-parameters', [0, 12]], ['aside:has(.object-choice)', [0, 12]], ['#simulator-controls', [0, 12]], ['#viewer-settings', [0, 12]],
  ['#mode', [-20, 0]], ['#position', [-20, 0]], ['#scene-macros', [-14, 6]], ['[data-part="unit-footer"]', [-14, 10]],
  ['#sensor-readout', [-14, 10]], ['.mini-console-card', [0, 12]], ['#command', [-14, 0]], ['#trace', [0, 12]], ['#timeline', [-14, 0]],
]

Object.assign(recipes, {
  'shots-console': { out: CONSOLE, run: async s => {
    await s.profile('boxturtle2_ercf')
    await tall(s)
    await s.b.click('#scene [data-part="gate-status-pill"][data-gate="5"]')
    await sleep(1000)
    const menu = await s.b.rect('#gate-menu')
    await s.shot('gate-menu.png', { x: menu.x - 150, y: menu.y - 40, width: menu.width + 300, height: menu.height + 80 })
    await s.b.key('Escape')
    await normal(s)
    await s.run('MMU_LOAD')
    await s.run('MMU_CHANGE_TOOL GATE=4')
    await s.seek('espooler.*assist', -1)
    await s.pause()
    await tall(s)
    await s.b.move(5, 5)
    await s.shotOf('connection.png', '#connection-panel', 6)
    await s.shotOf('playback.png', '#sidebar-playback', 6)
    await s.shotOf('tool-mapping.png', '#tool-mapping', 6)
    await s.shotOf('parameters.png', '#runtime-parameters', 6)
    await s.shotOf('toolhead-config.png', 'aside:has(.object-choice)', 6)
    await s.shotOf('simulator-setup.png', '#simulator-controls', 6)
    const settings = await s.b.rect('#viewer-settings'), divider = await s.b.rect('.settings-divider')
    await s.shot('settings.png', { x: settings.x - 6, y: settings.y - 6, width: settings.width + 12, height: divider.y - settings.y + 6 })
    await s.shotOf('console.png', '.mini-console-card', 6)
    await s.shotOf('trace.png', '#trace-card, .card:has(#trace)', 6)
    await s.b.eval(`document.querySelector('#sensor-readout').open = true`)
    await sleep(500)
    await s.shotOf('readout.png', '#sensor-readout', 10)
    await s.b.eval(`document.querySelector('#sensor-readout').open = false`)
    const rack = await s.b.rect('[data-part="unit-footer"]'), scene = await s.b.rect('#scene')
    await s.shot('unit-footer.png', { x: scene.x, y: rack.y - 190, width: scene.width, height: 260 })
    await normal(s)
    // callouts over a full-page capture
    await tall(s)
    await addCallouts(s.b, CALLOUTS)
    await s.shot('layout.png')
    await removeCallouts(s.b)
    await normal(s)
  } },

  // The gate menu: Select, Load and Unload from a spool's pop-up, on a BoxTurtle gate (the espooler assists the load and rewinds on unload)
  'clip-gate-menu': { out: CONSOLE, run: async s => {
    await s.profile('boxturtle2_ercf')
    await s.clip('gate-menu.webp', async () => {
      await itemClick(s, 5, 'Select'); await s.settle()
      await itemClick(s, 5, 'Load'); await s.settle()
      await itemClick(s, 5, 'Unload'); await s.settle()
    }, { scale: 0.6, fps: 8, quality: 50 })
  } },
})


Object.assign(recipes, {
  // Stepping through a captured toolchange, and a configuration edit appearing in the trace
  'shots-telemetry': { out: TELEMETRY, run: async s => {
    await s.profile('qidi')
    await s.run('MMU_LOAD')
    await s.run(`MMU_CHANGE_TOOL GATE=${await s.otherGate()}`)
    await s.seek('Toolhead filament cut')
    await s.pause()
    await tall(s)
    await s.b.move(5, 5)
    await s.shotOf('step-cut.png', FIRST_CARD, 0)
    await s.shotOf('step-trace.png', '.card:has(#trace)', 6)
    await s.b.eval(`(() => { const p = document.querySelector('aside:has(.object-choice)'); p.querySelector('.object-value').value = '80'; p.querySelector('.object-apply').click() })()`)
    await sleep(4000)
    await s.b.click('#live')
    await sleep(1500)
    await s.shotOf('config-edit.png', '.card:has(#trace)', 6)
    await s.shotOf('toolhead-config.png', 'aside:has(.object-choice)', 6)
    await normal(s)
  } },

  'shots-simulator': { out: SIM, run: async s => {
    await s.profile('boxturtle2_ercf')
    await s.run('MMU_LOAD')
    await s.b.move(5, 5)
    await s.shot('visualizer.png')
    await tall(s)
    await s.shotOf('simulator-setup.png', '#simulator-controls', 6)
    await normal(s)
  } },
})

const only = option('--only', '').split(',').filter(Boolean)
if (args.includes('--list')) { console.log(Object.keys(recipes).join('\n')); process.exit(0) }

const b = await Browser.launch({ width: WIDTH, height: HEIGHT, scale: 1 })
const session = new Session(b)
try {
  await session.open()
  for (const [name, recipe] of Object.entries(recipes)) {
    if (only.length && !only.includes(name)) continue
    session.outDir = path.join(DOC, recipe.out)
    fs.mkdirSync(session.outDir, { recursive: true })
    console.log(`== ${name}`)
    await recipe.run(session)
  }
} finally { await b.close() }
