// Minimal Chrome DevTools driver for photographing the Happy Hare Console (the Visualizer web app).
//
// Used by capture_viewer.mjs; see doc_tools/README.md, "Photographing the Happy Hare Console".
// Needs Node 22+ (built-in fetch and WebSocket) and Google Chrome. It launches its own headless
// Chrome on its own profile directory, so it never touches the one you browse with.
import fs from 'fs'
import os from 'os'
import path from 'path'
import { spawn } from 'child_process'

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = Number(process.env.CDP_PORT || 9334)
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

export class Browser {
  static async launch({ width = 1440, height = 900, scale = 1 } = {}) {
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'hh-viewer-chrome-'))
    const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
      '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', `--window-size=${width},${height}`, 'about:blank'],
    { stdio: 'ignore' })
    let target = null
    for (let i = 0; i < 50 && !target; i++) {
      await sleep(200)
      try { target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json() } catch { /* not up yet */ }
    }
    if (!target) throw new Error('Chrome did not start listening for DevTools')
    const browser = new Browser(proc, profile, target, { width, height, scale })
    await browser.connect()
    return browser
  }

  constructor(proc, profile, target, view) {
    this.proc = proc; this.profile = profile; this.target = target; this.view = view
    this.next = 0; this.pending = new Map(); this.listeners = new Map()
  }

  async connect() {
    this.ws = new WebSocket(this.target.webSocketDebuggerUrl)
    await new Promise(resolve => { this.ws.onopen = resolve })
    this.ws.onmessage = event => {
      const message = JSON.parse(event.data)
      if (message.id && this.pending.has(message.id)) { this.pending.get(message.id)(message); this.pending.delete(message.id) }
      else if (message.method) for (const fn of this.listeners.get(message.method) || []) fn(message.params)
    }
    await this.send('Page.enable')
    await this.setView(this.view)
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.next
      this.pending.set(id, message => message.error ? reject(new Error(`${method}: ${message.error.message}`)) : resolve(message.result))
      this.ws.send(JSON.stringify({ id, method, params }))
    })
  }

  on(method, fn) { this.listeners.set(method, [...(this.listeners.get(method) || []), fn]) }

  setView({ width, height, scale = 1 }) {
    this.view = { width, height, scale }
    return this.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile: false })
  }

  async goto(url) {
    await this.send('Page.navigate', { url })
    await sleep(1500)
  }

  async eval(expression) {
    const result = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || 'evaluation failed')
    return result.result.value
  }

  // Wait for a predicate (a JS expression) to become truthy in the page.
  async until(expression, timeout = 30000, step = 200) {
    const end = Date.now() + timeout
    while (Date.now() < end) {
      if (await this.eval(`Boolean(${expression})`)) return
      await sleep(step)
    }
    throw new Error(`timed out waiting for: ${expression}`)
  }

  rect(selector) {
    return this.eval(`(() => { const e = document.querySelector(${JSON.stringify(selector)}); if (!e) return null
      const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height } })()`)
  }

  async click(selector) {
    await this.eval(`(() => { const e = document.querySelector(${JSON.stringify(selector)}); if (!e) return
      const r = e.getBoundingClientRect(); if (r.top < 0 || r.bottom > innerHeight) e.scrollIntoView({ block: 'center' }) })()`)
    await sleep(100)
    const r = await this.rect(selector)
    if (!r) throw new Error(`no element ${selector}`)
    return this.clickAt(r.x + r.width / 2, r.y + r.height / 2)
  }

  async move(x, y) { await this.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }) }

  async clickAt(x, y) {
    await this.move(x, y)
    await this.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 })
    await this.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 })
  }

  async type(selector, text) {
    await this.eval(`(() => { const e = document.querySelector(${JSON.stringify(selector)}); e.focus(); e.select?.() })()`)
    await this.send('Input.insertText', { text })
  }

  async key(key) {
    const code = { Enter: 13, ArrowLeft: 37, ArrowRight: 39, Escape: 27 }[key]
    for (const type of ['keyDown', 'keyUp']) await this.send('Input.dispatchKeyEvent', { type, key, windowsVirtualKeyCode: code })
  }

  // PNG of the viewport, or of a clip rectangle ({x, y, width, height} in CSS pixels).
  async screenshot(file, clip) {
    const params = { format: 'png', captureBeyondViewport: false }
    if (clip) params.clip = { ...clip, scale: 1 }
    const { data } = await this.send('Page.captureScreenshot', params)
    fs.writeFileSync(file, Buffer.from(data, 'base64'))
  }

  // Record the page while `action()` runs. Returns [{ t, file }] with t in seconds from the first frame.
  async record(dir, action, { quality = 80 } = {}) {
    fs.mkdirSync(dir, { recursive: true })
    const frames = []
    let first = null, active = true
    const onFrame = ({ data, metadata, sessionId }) => {
      this.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
      if (!active) return
      if (first === null) first = metadata.timestamp
      const file = path.join(dir, `f${String(frames.length).padStart(5, '0')}.jpg`)
      fs.writeFileSync(file, Buffer.from(data, 'base64'))
      frames.push({ t: metadata.timestamp - first, file })
    }
    this.on('Page.screencastFrame', onFrame)
    await this.send('Page.startScreencast', { format: 'jpeg', quality, everyNthFrame: 2 })
    try { await action() } finally {
      active = false
      await this.send('Page.stopScreencast')
      this.listeners.set('Page.screencastFrame', (this.listeners.get('Page.screencastFrame') || []).filter(fn => fn !== onFrame))
    }
    return frames
  }

  async close() {
    try { this.ws.close() } catch { /* already closed */ }
    const exited = new Promise(resolve => this.proc.once('exit', resolve))
    this.proc.kill()
    await Promise.race([exited, sleep(3000)])
    try { fs.rmSync(this.profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }) } catch { /* temp dir; the OS clears it */ }
  }
}

export { sleep }
