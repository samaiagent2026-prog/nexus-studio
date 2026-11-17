/* ============================================================
   Minimal ZIP writer (store method, no compression).

   The exported site is a self-contained bundle of HTML, CSS and
   media, so we need to hand the browser a single file. Pulling in
   a compression library for this would be overkill: the payload
   is mostly already-compressed images, and ZIP "store" entries are
   accepted by every unzip tool on every platform.
   ============================================================ */

export interface ZipEntry {
  /** Path inside the archive, using forward slashes. */
  path: string
  /** UTF-8 text content. */
  text?: string
  /** Raw bytes (takes precedence over `text`). */
  bytes?: Uint8Array
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

const encoder = new TextEncoder()

interface Prepared {
  path: string
  nameBytes: Uint8Array
  data: Uint8Array
  crc: number
  isDir: boolean
}

export function createZip(entries: ZipEntry[]): Blob {
  const prepared: Prepared[] = entries.map((entry) => {
    const nameBytes = encoder.encode(entry.path)
    const data = entry.bytes ?? encoder.encode(entry.text ?? '')
    const isDir = entry.path.endsWith('/')
    return { path: entry.path, nameBytes, data, crc: crc32(data), isDir }
  })

  // Directory entries make the archive friendlier to tools that show a tree.
  const dirs = new Set<string>()
  for (const entry of prepared) {
    const parts = entry.path.split('/').slice(0, -1)
    let acc = ''
    for (const part of parts) {
      acc += `${part}/`
      dirs.add(acc)
    }
  }
  for (const dir of dirs) {
    if (prepared.some((p) => p.isDir && p.path === dir)) continue
    prepared.push({ path: dir, nameBytes: encoder.encode(dir), data: new Uint8Array(0), crc: 0, isDir: true })
  }

  const chunks: Uint8Array[] = []
  const central: Uint8Array[] = []
  let offset = 0

  for (const entry of prepared) {
    const local = new Uint8Array(30 + entry.nameBytes.length)
    const view = new DataView(local.buffer)
    view.setUint32(0, 0x04034b50, true)
    view.setUint16(4, 20, true) // version needed
    view.setUint16(6, 0x0800, true) // UTF-8 filename flag
    view.setUint16(8, 0, true) // store
    view.setUint16(10, 0, true) // mod time
    view.setUint16(12, 0, true) // mod date
    view.setUint32(14, entry.crc, true)
    view.setUint32(18, entry.data.length, true)
    view.setUint32(22, entry.data.length, true)
    view.setUint16(26, entry.nameBytes.length, true)
    view.setUint16(28, 0, true) // extra length
    local.set(entry.nameBytes, 30)

    chunks.push(local, entry.data)

    const header = new Uint8Array(46 + entry.nameBytes.length)
    const hv = new DataView(header.buffer)
    hv.setUint32(0, 0x02014b50, true)
    hv.setUint16(4, 20, true) // version made by
    hv.setUint16(6, 20, true) // version needed
    hv.setUint16(8, 0x0800, true)
    hv.setUint16(10, 0, true)
    hv.setUint16(12, 0, true)
    hv.setUint16(14, 0, true)
    hv.setUint32(16, entry.crc, true)
    hv.setUint32(20, entry.data.length, true)
    hv.setUint32(24, entry.data.length, true)
    hv.setUint16(28, entry.nameBytes.length, true)
    hv.setUint16(30, 0, true) // extra
    hv.setUint16(32, 0, true) // comment
    hv.setUint16(34, 0, true) // disk
    hv.setUint16(36, 0, true) // internal attrs
    hv.setUint32(38, entry.isDir ? 0x10 : 0, true) // external attrs
    hv.setUint32(42, offset, true)
    header.set(entry.nameBytes, 46)
    central.push(header)

    offset += local.length + entry.data.length
  }

  const centralSize = central.reduce((n, c) => n + c.length, 0)
  const end = new Uint8Array(22)
  const ev = new DataView(end.buffer)
  ev.setUint32(0, 0x06054b50, true)
  ev.setUint16(8, prepared.length, true)
  ev.setUint16(10, prepared.length, true)
  ev.setUint32(12, centralSize, true)
  ev.setUint32(16, offset, true)

  const parts: BlobPart[] = [...chunks, ...central, end].map((u) => u.slice().buffer as ArrayBuffer)
  return new Blob(parts, { type: 'application/zip' })
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  // Safari needs the node to survive the current task, and the URL must stay
  // alive until the download has actually started.
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 4000)
}
