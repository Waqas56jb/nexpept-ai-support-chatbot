/**
 * NexPept Chatbot — WordPress / any-site embed loader
 *
 * <script src="https://nexpept-ai-support-chatbot-mu.vercel.app/embed.js" async></script>
 */
;(function () {
  if (window.__NEXPEPT_CHAT_LOADED__) return
  window.__NEXPEPT_CHAT_LOADED__ = true

  var ORIGIN = 'https://nexpept-ai-support-chatbot-mu.vercel.app'
  var API = 'https://nexpept-ai-support-chatbot-server-two.vercel.app/api'
  var script = document.currentScript
  if (script && script.src) {
    try {
      ORIGIN = new URL(script.src).origin
    } catch (e) {
      /* keep default */
    }
  }

  var frame = null
  var visible = false

  function setFrameVisible(on) {
    visible = !!on
    if (!frame) return
    if (visible) {
      frame.style.display = 'block'
      frame.style.pointerEvents = 'auto'
      frame.setAttribute('aria-hidden', 'false')
    } else {
      frame.style.display = 'none'
      frame.style.pointerEvents = 'none'
      frame.setAttribute('aria-hidden', 'true')
    }
  }

  function ensureFrame() {
    if (frame && document.body.contains(frame)) return frame
    frame = document.getElementById('nexpept-chat-frame')
    if (frame) return frame

    frame = document.createElement('iframe')
    frame.id = 'nexpept-chat-frame'
    frame.title = 'NexPept Chat'
    frame.src = ORIGIN + '/?embed=1&v=' + Date.now()
    frame.setAttribute('allow', 'clipboard-write')
    frame.setAttribute('aria-hidden', 'true')
    frame.style.cssText = [
      'position:fixed',
      'right:0',
      'bottom:0',
      'width:420px',
      'height:760px',
      'max-width:100vw',
      'max-height:100vh',
      'border:0',
      'z-index:2147483000',
      'background:transparent',
      'color-scheme:light',
      'display:none',
      'pointer-events:none',
    ].join(';')

    document.body.appendChild(frame)
    return frame
  }

  function checkAdminSwitch() {
    var url = API + '/chat/settings?_=' + Date.now()
    fetch(url, { cache: 'no-store', credentials: 'omit' })
      .then(function (res) {
        return res.ok ? res.json() : null
      })
      .then(function (data) {
        if (!data) return
        var on = data.widgetEnabled !== false
        if (on) {
          ensureFrame()
          setFrameVisible(true)
        } else {
          setFrameVisible(false)
        }
      })
      .catch(function () {
        /* keep last known state */
      })
  }

  function mount() {
    ensureFrame()
    // Hidden until settings confirm ON (and until iframe posts show)
    setFrameVisible(false)
    checkAdminSwitch()
    setInterval(checkAdminSwitch, 4000)

    window.addEventListener('message', function (event) {
      if (!event || event.origin !== ORIGIN) return
      var data = event.data || {}
      if (data.source !== 'nexpept-chat') return

      if (data.type === 'visibility') {
        if (data.enabled) {
          ensureFrame()
          setFrameVisible(true)
        } else {
          setFrameVisible(false)
        }
      }
      if (data.type === 'hide') setFrameVisible(false)
      if (data.type === 'show') {
        ensureFrame()
        setFrameVisible(true)
      }
      if (data.type === 'resize' && data.width && data.height && visible) {
        frame.style.width = Math.min(data.width, window.innerWidth) + 'px'
        frame.style.height = Math.min(data.height, window.innerHeight) + 'px'
      }
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount)
  } else {
    mount()
  }
})()
