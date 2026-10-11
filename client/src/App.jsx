import { useEffect, useState } from 'react'
import ChatWidget from './components/chatbot/ChatWidget'
import './App.css'

function isEmbedMode() {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  return params.get('embed') === '1' || params.get('mode') === 'widget'
}

function App() {
  const [expanded, setExpanded] = useState(false)
  const embed = isEmbedMode()

  useEffect(() => {
    if (!embed) return
    document.documentElement.classList.add('np-embed')
    document.body.classList.add('np-embed')
    return () => {
      document.documentElement.classList.remove('np-embed')
      document.body.classList.remove('np-embed')
    }
  }, [embed])

  useEffect(() => {
    if (!embed || typeof window === 'undefined' || window.parent === window) return
    const width = expanded ? 500 : 420
    const height = expanded ? 860 : 760
    window.parent.postMessage(
      { source: 'nexpept-chat', type: 'resize', width, height },
      '*',
    )
  }, [embed, expanded])

  if (embed) {
    return (
      <div className="embed-root">
        <ChatWidget mode="widget" onExpandedChange={setExpanded} />
      </div>
    )
  }

  return (
    <div className="demo-page">
      <div className={`demo-stage ${expanded ? 'is-expanded' : ''}`}>
        <ChatWidget mode="page" onExpandedChange={setExpanded} />
      </div>
    </div>
  )
}

export default App
