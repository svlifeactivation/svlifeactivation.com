// vim: et:si:ts=2:sts=2:sw=2:nowrap

class Content extends Map {
  constructor(textfiles, binaryfiles) {
    super()
    const add = (files, fn) => files.forEach(([k, v, m]) => this.set(k, {value: fn(v), metadata: m}))
    add(textfiles, v => new TextEncoder().encode(v).buffer)
    add(binaryfiles, v => Uint8Array.from(atob(v), c => c.charCodeAt(0)))
  }
  get(key, type) {
    return this.getWithMetadata(key).value
  }
  getWithMetadata(key, type) {
    return this.has(key) ? super.get(key) : { value: null, metadata: null }
  }
}

global.__STATIC_CONTENT_MANIFEST = ${manifest:indent=2}
global.__STATIC_CONTENT = new Content(${content:indent=2}, ${b64content:indent=2})
