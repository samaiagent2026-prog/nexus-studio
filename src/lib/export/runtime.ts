/* ============================================================
   Runtime shipped inside every exported site.

   The static HTML already contains the fully rendered markup, so
   this script only re-attaches the behaviours that cannot be
   expressed in HTML alone: language switching (with the RTL flip),
   the mobile menu, accordions, tabs and the gallery lightbox.
   Everything is delegated from the document so it works no matter
   which blocks the exporter produced.
   ============================================================ */

export const EXPORT_RUNTIME = String.raw`
(function () {
  var LANG_KEY = 'nexus-lang'
  var dirFor = function (code) { return code === 'ar' ? 'rtl' : 'ltr' }
  var root = document.documentElement

  function setLang(code) {
    root.setAttribute('lang', code)
    root.setAttribute('dir', dirFor(code))
    document.querySelectorAll('[data-nexus-i18n]').forEach(function (el) {
      var text = el.getAttribute('data-' + code)
      if (text != null) el.textContent = text
    })
    document.querySelectorAll('[data-nexus-lang]').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-nexus-lang') === code)
    })
    try { localStorage.setItem(LANG_KEY, code) } catch (e) {}
  }

  function closest(el, sel) {
    while (el && el.nodeType === 1) {
      if (el.matches(sel)) return el
      el = el.parentElement
    }
    return null
  }

  document.addEventListener('click', function (e) {
    var langBtn = closest(e.target, '[data-nexus-lang]')
    if (langBtn) { e.preventDefault(); setLang(langBtn.getAttribute('data-nexus-lang')); return }

    var menuBtn = closest(e.target, '[data-nexus-menu-toggle]')
    if (menuBtn) {
      e.preventDefault()
      var header = closest(menuBtn, 'header') || document
      var panel = header.querySelector('[data-nexus-menu]')
      if (panel) {
        var opening = panel.classList.contains('hidden')
        panel.classList.toggle('hidden', !opening)
        menuBtn.setAttribute('aria-expanded', String(opening))
      }
      return
    }

    var acc = closest(e.target, '[data-nexus-accordion-trigger]')
    if (acc) {
      e.preventDefault()
      var item = closest(acc, '[data-nexus-accordion-item]')
      if (item) {
        var wasOpen = item.getAttribute('data-open') === 'true'
        var group = closest(item, '[data-nexus-accordion]') || document
        group.querySelectorAll('[data-nexus-accordion-item][data-open="true"]').forEach(function (other) {
          if (other === item) return
          other.setAttribute('data-open', 'false')
          var ob = other.querySelector('[data-nexus-accordion-panel]')
          if (ob) { ob.classList.add('hidden'); ob.setAttribute('aria-hidden', 'true') }
          var ot = other.querySelector('[data-nexus-accordion-trigger]')
          if (ot) ot.setAttribute('aria-expanded', 'false')
        })
        item.setAttribute('data-open', String(!wasOpen))
        var body = item.querySelector('[data-nexus-accordion-panel]')
        if (body) {
          body.classList.toggle('hidden', wasOpen)
          body.setAttribute('aria-hidden', String(wasOpen))
        }
        acc.setAttribute('aria-expanded', String(!wasOpen))
      }
      return
    }

    var tab = closest(e.target, '[data-nexus-tab]')
    if (tab) {
      e.preventDefault()
      var groupEl = closest(tab, '[data-nexus-tabs-root]') || document
      var name = tab.getAttribute('data-nexus-tab')
      groupEl.querySelectorAll('[data-nexus-tab]').forEach(function (t) {
        t.classList.toggle('is-active', t === tab)
        t.setAttribute('aria-selected', String(t === tab))
      })
      groupEl.querySelectorAll('[data-nexus-tab-panel]').forEach(function (panel) {
        panel.classList.toggle('hidden', panel.getAttribute('data-nexus-tab-panel') !== name)
      })
      return
    }

    var thumb = closest(e.target, '[data-nexus-lightbox-src]')
    if (thumb) {
      e.preventDefault()
      var overlay = document.querySelector('[data-nexus-lightbox]')
      if (overlay) {
        var img = overlay.querySelector('img')
        if (img) img.setAttribute('src', thumb.getAttribute('data-nexus-lightbox-src'))
        overlay.classList.remove('hidden')
        document.body.style.overflow = 'hidden'
      }
      return
    }
    var close = closest(e.target, '[data-nexus-lightbox-close]')
    if (close) {
      e.preventDefault()
      var box = closest(close, '[data-nexus-lightbox]')
      if (box) box.classList.add('hidden')
      document.body.style.overflow = ''
    }
  })

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return
    var overlay = document.querySelector('[data-nexus-lightbox]')
    if (overlay && !overlay.classList.contains('hidden')) {
      overlay.classList.add('hidden')
      document.body.style.overflow = ''
    }
  })

  document.querySelectorAll('[data-nexus-lightbox],[data-nexus-menu]').forEach(function (el) {
    if (el.hasAttribute('hidden')) el.classList.add('hidden')
  })
  try { setLang(localStorage.getItem(LANG_KEY) || root.getAttribute('lang') || 'en') } catch (e) {}
})()
`
