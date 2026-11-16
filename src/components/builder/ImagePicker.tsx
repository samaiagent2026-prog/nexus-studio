import React from 'react'
import { resolveIcon, Ic } from '../../lib/icons'
import { cn, formatBytes, readFileAsDataUrl, uid } from '../../lib/utils'
import type { Lang, MediaAsset } from '../../lib/types'
import { Modal, TextInput } from '../ui'
import { t } from '../../lib/i18n'

/* ============================================================
   Media library + uploader. Files are inlined as data URLs so
   the whole site stays portable in one JSON document.
   ============================================================ */

const SUGGESTED = [
  'https://picsum.photos/seed/nexus-hero/1600/1000',
  'https://picsum.photos/seed/nexus-team/1200/800',
  'https://picsum.photos/seed/nexus-product/1200/1200',
  'https://picsum.photos/seed/nexus-space/1400/900',
  'https://picsum.photos/seed/nexus-food/1200/800',
  'https://picsum.photos/seed/nexus-city/1600/900',
]

export function ImagePicker({
  value,
  onChange,
  media,
  onAddMedia,
  label,
  trigger,
  aspect = '4/3',
  lang = 'en',
}: {
  value?: string
  onChange: (url: string) => void
  media: MediaAsset[]
  onAddMedia: (assets: MediaAsset[]) => void
  label?: string
  trigger?: React.ReactNode
  aspect?: string
  lang?: Lang
}) {
  const [open, setOpen] = React.useState(false)
  const title = label ?? t(lang, 'chooseImage')
  const [url, setUrl] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const fileRef = React.useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setBusy(true)
    const assets: MediaAsset[] = []
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      try {
        const dataUrl = await readFileAsDataUrl(file)
        assets.push({ id: uid('media'), name: file.name, url: dataUrl, kind: 'image', size: file.size, createdAt: Date.now() })
      } catch {
        /* skip unreadable file */
      }
    }
    if (assets.length) {
      onAddMedia(assets)
      onChange(assets[0].url)
      setOpen(false)
    }
    setBusy(false)
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="w-full">
        {trigger ?? (
          <span className="group flex w-full items-center gap-3 rounded-xl border border-ink-200 bg-white p-2 transition hover:border-brand-300">
            <span className="h-11 w-14 shrink-0 overflow-hidden rounded-lg bg-ink-100" style={{ aspectRatio: aspect }}>
              {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center text-ink-400"><Ic n='Image' size={16} /></span>}
            </span>
            <span className="min-w-0 flex-1 text-start">
              <span className="block truncate text-[12.5px] font-semibold text-ink-800">{value ? t(lang, 'replaceImage') : t(lang, 'uploadImage')}</span>
              <span className="block truncate text-[11px] text-ink-400">{value ? value.replace(/^data:.*/, t(lang, 'uploaded')) : t(lang, 'uploadOrPasteUrl')}</span>
            </span>
            <Ic n='ChevronDown' size={14} className="shrink-0 text-ink-400" />
          </span>
        )}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={title} subtitle={t(lang, 'uploadOrPasteUrl')} size="lg" icon="Image" lang={lang}>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            void handleFiles(e.dataTransfer.files)
          }}
          className="mb-5 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink-300 bg-[var(--surface-2)] px-6 py-9 text-center transition hover:border-brand-400"
        >
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-soft">
            <Ic n={busy ? 'Loader2' : 'Upload'} size={22} className={busy ? 'animate-spin' : ''} />
          </span>
          <p className="text-[13.5px] font-semibold text-ink-800">{t(lang, 'dragDropImages')}</p>
          <p className="text-[12px] text-ink-500">{t(lang, 'imageFormats')}</p>
          <button type="button" className="btn-primary mt-1" onClick={() => fileRef.current?.click()} disabled={busy}>
            <Ic n='Upload' size={15} />
            {t(lang, 'chooseFile')}
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => void handleFiles(e.target.files)} />
        </div>

        <div className="mb-5 flex items-end gap-2">
          <TextInput value={url} onChange={setUrl} placeholder="https://…/image.jpg" icon="Link" className="flex-1" />
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              if (!url.trim()) return
              onChange(url.trim())
              onAddMedia([{ id: uid('media'), name: url.split('/').pop() || 'linked image', url: url.trim(), kind: 'image', createdAt: Date.now() }])
              setUrl('')
              setOpen(false)
            }}
          >
            {t(lang, 'useUrl')}
          </button>
        </div>

        {media.length > 0 && (
          <>
            <h4 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-400">{t(lang, 'yourLibrary')}</h4>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {media.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => {
                    onChange(asset.url)
                    setOpen(false)
                  }}
                  className={cn(
                    'group relative aspect-square overflow-hidden rounded-xl border bg-ink-100 transition hover:-translate-y-0.5 hover:shadow-lift',
                    value === asset.url ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-ink-200',
                  )}
                  title={asset.name}
                >
                  <img src={asset.url} alt={asset.name} className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          </>
        )}

        <h4 className="mb-2.5 mt-5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-400">{t(lang, 'stockSuggestions')}</h4>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {SUGGESTED.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                onChange(s)
                setOpen(false)
              }}
              className="aspect-square overflow-hidden rounded-xl border border-ink-200 bg-ink-100 transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <img src={s} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      </Modal>
    </>
  )
}

export function MediaGrid({
  media,
  onRemove,
  onAdd,
  lang = 'en',
}: {
  media: MediaAsset[]
  onRemove: (id: string) => void
  onAdd: (assets: MediaAsset[]) => void
  lang?: Lang
}) {
  const fileRef = React.useRef<HTMLInputElement>(null)
  const [busy, setBusy] = React.useState(false)

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setBusy(true)
    const assets: MediaAsset[] = []
    for (const file of Array.from(files)) {
      try {
        const dataUrl = await readFileAsDataUrl(file)
        assets.push({ id: uid('media'), name: file.name, url: dataUrl, kind: file.type.startsWith('image/') ? 'image' : 'file', size: file.size, createdAt: Date.now() })
      } catch {
        /* ignore */
      }
    }
    if (assets.length) onAdd(assets)
    setBusy(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          void handleFiles(e.dataTransfer.files)
        }}
        className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-ink-300 bg-[var(--surface-2)] px-6 py-8 text-center"
      >
        <Ic n='Upload' size={22} className="text-brand-600" />
        <p className="text-[13px] font-semibold text-ink-700">{t(lang, 'dropFilesUpload')}</p>
        <button type="button" className="btn-outline" onClick={() => fileRef.current?.click()} disabled={busy}>
          {busy ? t(lang, 'uploading') : t(lang, 'browseFiles')}
        </button>
        <input ref={fileRef} type="file" multiple accept="image/*" className="sr-only" onChange={(e) => void handleFiles(e.target.files)} />
      </div>

      {media.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-ink-500">{t(lang, 'noMediaYet')}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {media.map((asset) => (
            <div key={asset.id} className="group relative overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-soft">
              <div className="aspect-square overflow-hidden bg-ink-100">
                {asset.kind === 'image' ? (
                  <img src={asset.url} alt={asset.name} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <span className="flex h-full items-center justify-center text-ink-400"><Ic n='FileText' size={26} /></span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 p-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[11.5px] font-semibold text-ink-800">{asset.name}</p>
                  <p className="text-[10.5px] text-ink-400">{formatBytes(asset.size)}</p>
                </div>
                <button type="button" onClick={() => onRemove(asset.id)} className="rounded-lg p-1.5 text-rose-600 transition hover:bg-rose-50" aria-label={t(lang, 'deleteBlock')}>
                  <Ic n='Trash2' size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
