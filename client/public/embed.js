/**
 * NexPept Chatbot — WordPress / any-site embed loader
 *
 * Usage (paste before </body>):
 * <script src="https://nexpept-ai-support-chatbot.vercel.app/embed.js" async></script>
 */
;(function () {
  if (window.__NEXPEPT_CHAT_LOADED__) return
  window.__NEXPEPT_CHAT_LOADED__ = true

  var ORIGIN = 'https://nexpept-ai-support-chatbot.vercel.app'
  var script = document.currentScript
  if (script && script.src) {
    try {
      ORIGIN = new URL(script.src).origin
    } catch (e) {
      /* keep default */
    }
  }

  function mount() {
    if (document.getElementById('nexpept-chat-frame')) return

    var frame = document.createElement('iframe')
    frame.id = 'nexpept-chat-frame'
    frame.title = 'NexPept Chat'
    frame.src = ORIGIN + '/?embed=1'
    frame.setAttribute('allow', 'clipboard-write')
    frame.setAttribute(
      'style',
      [
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
        'pointer-events:none',
      ].join(';'),
    )

    // Allow clicks only on the widget; pass-through elsewhere via messages
    frame.addEventListener('load', function () {
      frame.style.pointerEvents = 'auto'
    })

    window.addEventListener('message', function (event) {
      if (!event || event.origin !== ORIGIN) return
      var data = event.data || {}
      if (data.source !== 'nexpept-chat') return
      if (data.type === 'resize' && data.width && data.height) {
        frame.style.width = Math.min(data.width, window.innerWidth) + 'px'
        frame.style.height = Math.min(data.height, window.innerHeight) + 'px'
      }
      if (data.type === 'hide') {
        frame.style.display = 'none'
      }
      if (data.type === 'show') {
        frame.style.display = 'block'
      }
    })

    document.body.appendChild(frame)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount)
  } else {
    mount()
  }
})()
