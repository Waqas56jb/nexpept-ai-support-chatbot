import { useState } from 'react'
import ChatWidget from './components/chatbot/ChatWidget'
import './App.css'

function App() {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="demo-page">
      <div className={`demo-stage ${expanded ? 'is-expanded' : ''}`}>
        <ChatWidget mode="page" onExpandedChange={setExpanded} />
      </div>
    </div>
  )
}

export default App
