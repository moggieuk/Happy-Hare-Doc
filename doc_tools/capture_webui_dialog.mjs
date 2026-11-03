// Screenshot an element of a real web UI (Mainsail/Fluidd) once it appears, for the docs.
//
//   node doc_tools/capture_webui_dialog.mjs URL OUT.png [CSS-SELECTOR]
//
// Needs Node 22+ (built-in fetch and WebSocket) and a headless Chrome already listening for
// DevTools on 127.0.0.1:9333. The default selector is Vuetify's open dialog, which is what
// Mainsail uses for the Happy Hare pause dialog. See doc_tools/README.md, "Photographing a web
// UI", for the whole procedure.
import fs from 'fs'

const [,, url, out, selector = '.v-dialog--active'] = process.argv
if (!url || !out) {
  console.error('usage: node capture_webui_dialog.mjs URL OUT.png [SELECTOR]')
  process.exit(2)
}

const target = await (await fetch('http://127.0.0.1:9333/json/new?about:blank', { method: 'PUT' })).json()
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise(resolve => { ws.onopen = resolve })

let nextId = 0
const pending = new Map()
ws.onmessage = event => {
  const message = JSON.parse(event.data)
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message)
    pending.delete(message.id)
  }
}
const send = (method, params = {}) => new Promise(resolve => {
  const id = ++nextId
  pending.set(id, resolve)
  ws.send(JSON.stringify({ id, method, params }))
})

await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 2, mobile: false })
await send('Page.navigate', { url })

// The dev server loads hundreds of modules and the dialog fades in, so poll for a settled element
let rect = null
for (let i = 0; i < 120 && !rect; i++) {
  await new Promise(resolve => setTimeout(resolve, 1000))
  const result = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const e = document.querySelector(${JSON.stringify(selector)})
      if (!e) return null
      const b = e.getBoundingClientRect()
      return b.width > 100 && getComputedStyle(e).opacity === '1' ? { x: b.x, y: b.y, width: b.width, height: b.height } : null
    })()`,
  })
  rect = result.result.result.value
}
if (!rect) {
  console.error('nothing matching ' + selector + ' appeared')
  process.exit(1)
}

await new Promise(resolve => setTimeout(resolve, 1500)) // let the fade finish
const shot = await send('Page.captureScreenshot', { format: 'png', clip: { ...rect, scale: 1 } })
fs.writeFileSync(out, Buffer.from(shot.result.data, 'base64'))
console.log('saved', out)
process.exit(0)
