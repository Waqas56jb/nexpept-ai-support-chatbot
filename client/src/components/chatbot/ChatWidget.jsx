import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Expand,
  Grid2x2,
  HelpCircle,
  MessageCircle,
  Send,
  Shrink,
  X,
} from 'lucide-react'
import { chatbotConfig } from '../../config'
import { countries, defaultCountry, getFlagUrl } from '../../data/countries'
import {
  getChatMessages,
  getChatSettings,
  getFaqs,
  mapApiMessageToUi,
  sendChatMessage,
  startChat as apiStartChat,
} from '../../api'
import './ChatWidget.css'

const emailOk = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#25D366"
        d="M12.04 2C6.58 2 2.15 6.4 2.15 11.84c0 1.94.51 3.83 1.48 5.5L2 22l4.82-1.58a10 10 0 0 0 5.22 1.43h.01c5.46 0 9.89-4.4 9.89-9.85C21.93 6.4 17.5 2 12.04 2zm5.76 13.98c-.24.68-1.4 1.25-1.93 1.33-.52.08-1.05.17-3.42-.73-2.86-1.08-4.7-3.84-4.84-4.02-.14-.18-1.14-1.5-1.14-2.86s.72-2.03.98-2.31c.24-.27.53-.34.71-.34h.51c.16 0 .38-.06.59.45.24.58.8 2 .87 2.14.07.14.12.3.02.49-.1.18-.14.3-.28.46-.14.16-.3.36-.43.48-.14.14-.29.29-.12.56.16.27.73 1.2 1.56 1.94 1.08.96 1.98 1.26 2.26 1.4.27.14.43.12.59-.07.16-.18.68-.79.86-1.06.18-.27.36-.22.61-.13.24.08 1.55.73 1.82.86.27.14.45.2.52.31.07.11.07.64-.17 1.32z"
      />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <radialGradient id="npIg" cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="5%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#npIg)" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.8" r="1.2" fill="#fff" />
    </svg>
  )
}

export default function ChatWidget({ mode = 'widget', onExpandedChange }) {
  const isPage = mode === 'page'
  const [open, setOpen] = useState(isPage)
  const [showBubble, setShowBubble] = useState(!isPage)
  const [expanded, setExpanded] = useState(false)

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev
      onExpandedChange?.(next)
      return next
    })
  }
  const [started, setStarted] = useState(false)
  const [conversationId, setConversationId] = useState(null)
  const [starting, setStarting] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)
  const [form, setForm] = useState({ email: '', name: '', phone: '' })
  const [country, setCountry] = useState(defaultCountry)
  const [countryOpen, setCountryOpen] = useState(false)
  const [countryQuery, setCountryQuery] = useState('')
  const [errors, setErrors] = useState({})
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState([])
  const [sending, setSending] = useState(false)
  const [faqs, setFaqs] = useState(chatbotConfig.faqs)
  const [widgetConfig, setWidgetConfig] = useState(chatbotConfig)
  const countryRef = useRef(null)
  const messagesEndRef = useRef(null)
  const pollSeqRef = useRef(0)
  const sendingRef = useRef(false)

  useEffect(() => {
    let active = true

    Promise.all([
      getFaqs().catch(() => null),
      getChatSettings().catch(() => null),
    ]).then(([faqRows, settings]) => {
      if (!active) return

      if (Array.isArray(faqRows) && faqRows.length) {
        setFaqs(
          faqRows.map((f) => ({
            id: f.id,
            question: f.title || f.question || '',
            answer: f.body || f.answer || '',
          })),
        )
      }

      if (settings && typeof settings === 'object') {
        setWidgetConfig((prev) => ({
          ...prev,
          brandName: settings.brandName ?? prev.brandName,
          greeting: settings.greeting ?? prev.greeting,
          headerTitle: settings.headerTitle ?? prev.headerTitle,
          agentName: settings.agentName ?? prev.agentName,
          agentAvatar: settings.agentAvatar ?? prev.agentAvatar,
          whatsappUrl: settings.whatsappUrl ?? prev.whatsappUrl,
          instagramUrl: settings.instagramUrl ?? prev.instagramUrl,
        }))
      }
    })

    return () => {
      active = false
    }
  }, [])

  const refreshMessages = useCallback(async (id) => {
    if (!id || sendingRef.current) return
    const seq = ++pollSeqRef.current
    const data = await getChatMessages(id)
    if (seq !== pollSeqRef.current || sendingRef.current) return
    const list = Array.isArray(data?.messages) ? data.messages : []
    setMessages(list.map(mapApiMessageToUi))
  }, [])

  useEffect(() => {
    if (!started || !conversationId) return
    refreshMessages(conversationId).catch(() => {})
    const timer = setInterval(() => {
      refreshMessages(conversationId).catch(() => {})
    }, 5000)
    return () => clearInterval(timer)
  }, [started, conversationId, refreshMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase()
    if (!q) return countries
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.iso.toLowerCase().includes(q) ||
        c.dial.includes(q),
    )
  }, [countryQuery])

  useEffect(() => {
    if (!countryOpen) return
    const onClick = (e) => {
      if (countryRef.current && !countryRef.current.contains(e.target)) {
        setCountryOpen(false)
        setCountryQuery('')
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [countryOpen])

  const channelMap = useMemo(
    () => ({
      whatsapp: widgetConfig.whatsappUrl,
      instagram: widgetConfig.instagramUrl,
    }),
    [widgetConfig.whatsappUrl, widgetConfig.instagramUrl],
  )

  const openPanel = () => {
    setOpen(true)
    setShowBubble(false)
  }

  const closePanel = () => {
    setOpen(false)
    setExpanded(false)
    onExpandedChange?.(false)
  }

  const validate = () => {
    const next = {}
    if (!form.email.trim()) next.email = 'Required field'
    else if (!emailOk(form.email)) next.email = 'Enter a valid email'
    if (!form.name.trim()) next.name = 'Required field'
    if (!form.phone.trim()) next.phone = 'Required field'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleStartChat = async () => {
    if (!validate() || starting) return
    setStarting(true)
    try {
      const result = await apiStartChat({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        countryCode: country.dial,
      })
      const id = result?.conversationId
      if (!id) throw new Error('Could not start chat')

      setConversationId(id)
      setStarted(true)
      const initial = Array.isArray(result.messages)
        ? result.messages.map(mapApiMessageToUi)
        : []
      setMessages(initial)
      await refreshMessages(id)
    } catch {
      setErrors((e) => ({ ...e, form: 'Could not start chat. Please try again.' }))
    } finally {
      setStarting(false)
    }
  }

  const pushUser = async (text) => {
    const trimmed = text.trim()
    if (!trimmed || !conversationId || sendingRef.current) return

    const pendingId = `u-pending-${Date.now()}`
    setMessages((prev) => [...prev, { id: pendingId, role: 'user', text: trimmed }])
    setDraft('')
    sendingRef.current = true
    setSending(true)
    // Invalidate in-flight polls so they cannot wipe the AI reply
    pollSeqRef.current += 1

    try {
      // Always POST /message — server handles handoff phrases + AI reply
      const result = await sendChatMessage(conversationId, trimmed)

      const fromSend = Array.isArray(result?.messages) ? result.messages : []
      if (fromSend.length) {
        setMessages((prev) => {
          const withoutPending = prev.filter((m) => m.id !== pendingId)
          const existingIds = new Set(withoutPending.map((m) => m.id))
          const mapped = fromSend.map(mapApiMessageToUi)
          const merged = [...withoutPending]
          for (const msg of mapped) {
            if (!existingIds.has(msg.id)) {
              merged.push(msg)
              existingIds.add(msg.id)
            }
          }
          return merged
        })
      }

      // Authoritative sync after send completes
      const data = await getChatMessages(conversationId)
      const list = Array.isArray(data?.messages) ? data.messages : []
      if (list.length) {
        setMessages(list.map(mapApiMessageToUi))
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'bot',
          text: 'Something went wrong sending your message. Please try again.',
        },
      ])
    } finally {
      sendingRef.current = false
      setSending(false)
    }
  }

  const onFaqClick = async (faq) => {
    setOpenFaq((prev) => (prev === faq.id ? null : faq.id))
    if (started && conversationId) {
      await pushUser(faq.question)
    }
  }

  const openChannel = (type) => {
    const url = channelMap[type]
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={`np-chat-root ${isPage ? 'is-page' : ''}`}>
      {!isPage && !open && showBubble && (
        <div className="np-welcome">
          <div className="np-welcome__avatar-wrap">
            <img
              className="np-welcome__avatar"
              src={widgetConfig.agentAvatar}
              alt={widgetConfig.agentName}
            />
            <span className="np-welcome__online-dot" />
          </div>
          <div className="np-welcome__text">
            <p className="np-welcome__title">{widgetConfig.bubbleTitle}</p>
            <p className="np-welcome__msg">{widgetConfig.greeting}</p>
          </div>
          <button
            type="button"
            className="np-welcome__close"
            aria-label="Dismiss"
            onClick={() => setShowBubble(false)}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {!isPage && !open && (
        <button
          type="button"
          className="np-launcher"
          aria-label="Open chat"
          onClick={openPanel}
        >
          <MessageCircle strokeWidth={2.2} />
        </button>
      )}

      {(isPage || open) && (
        <div className={`np-panel ${expanded ? 'is-expanded' : ''}`}>
          <div className="np-panel__top">
            <h2 className="np-panel__heading">
              <span aria-hidden="true">👋 </span>
              {widgetConfig.headerTitle}
            </h2>
            <div className="np-panel__actions">
              <button
                type="button"
                className="np-icon-btn"
                aria-label={expanded ? 'Shrink' : 'Expand'}
                onClick={toggleExpanded}
              >
                {expanded ? <Shrink size={18} /> : <Expand size={18} />}
              </button>
              {!isPage && (
                <button
                  type="button"
                  className="np-icon-btn"
                  aria-label="Close chat"
                  onClick={closePanel}
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          <div className="np-panel__body">
            {!started ? (
              <>
                <div className="np-card">
                  <div className="np-card__row">
                    <img
                      className="np-card__avatar"
                      src={widgetConfig.agentAvatar}
                      alt={widgetConfig.agentName}
                    />
                    <span className="np-online">
                      <span className="np-online__dot" />
                      ONLINE
                    </span>
                  </div>
                  <p className="np-card__greeting">{widgetConfig.greeting}</p>

                  <div className="np-field">
                    <label>
                      Email <span className="np-req">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      className={errors.email ? 'has-error' : ''}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, email: e.target.value }))
                      }
                      placeholder="you@email.com"
                    />
                    {errors.email && <p className="np-error">{errors.email}</p>}
                  </div>

                  <div className="np-field">
                    <label>
                      Name <span className="np-req">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      className={errors.name ? 'has-error' : ''}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      placeholder="Your name"
                    />
                    {errors.name && <p className="np-error">{errors.name}</p>}
                  </div>

                  <div className="np-field" ref={countryRef}>
                    <label>
                      Phone Number <span className="np-req">*</span>
                    </label>
                    <div className={`np-phone ${errors.phone ? 'has-error' : ''}`}>
                      <button
                        type="button"
                        className="np-phone__code"
                        onClick={() => setCountryOpen((v) => !v)}
                        aria-haspopup="listbox"
                        aria-expanded={countryOpen}
                      >
                        <img
                          className="np-phone__flag"
                          src={getFlagUrl(country.iso, 40)}
                          alt={country.name}
                          width={24}
                          height={18}
                        />
                        <ChevronDown size={14} strokeWidth={2.4} />
                      </button>
                      <span className="np-phone__divider" aria-hidden="true" />
                      <span className="np-phone__dial">{country.dial}</span>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, phone: e.target.value }))
                        }
                        placeholder=""
                        aria-label="Phone number"
                      />
                    </div>
                    {countryOpen && (
                      <div className="np-country-menu" role="listbox">
                        <input
                          className="np-country-search"
                          type="text"
                          value={countryQuery}
                          onChange={(e) => setCountryQuery(e.target.value)}
                          placeholder="Search for country"
                          autoFocus
                        />
                        <div className="np-country-list">
                          {filteredCountries.map((c) => (
                            <button
                              key={`${c.iso}-${c.dial}`}
                              type="button"
                              className={`np-country-item ${
                                c.iso === country.iso ? 'is-active' : ''
                              }`}
                              onClick={() => {
                                setCountry(c)
                                setCountryOpen(false)
                                setCountryQuery('')
                              }}
                            >
                              <img
                                className="np-country-item__flag"
                                src={getFlagUrl(c.iso, 40)}
                                alt=""
                                width={22}
                                height={16}
                              />
                              <span className="np-country-item__name">{c.name}</span>
                              <span className="np-country-item__dial">{c.dial}</span>
                            </button>
                          ))}
                          {filteredCountries.length === 0 && (
                            <p className="np-country-empty">No country found</p>
                          )}
                        </div>
                      </div>
                    )}
                    {errors.phone && <p className="np-error">{errors.phone}</p>}
                  </div>

                  {errors.form && <p className="np-error">{errors.form}</p>}

                  <button
                    type="button"
                    className="np-start-btn"
                    onClick={handleStartChat}
                    disabled={starting}
                  >
                    <span>{starting ? 'Starting…' : 'Start chatting'}</span>
                    <span className="np-start-btn__icon">
                      <Send size={14} />
                    </span>
                  </button>
                </div>

                <div className="np-section">
                  <div className="np-section__head">
                    <span className="np-section__icon">
                      <HelpCircle size={15} />
                    </span>
                    <h3 className="np-section__title">Frequently Asked Questions</h3>
                  </div>
                  {faqs.map((faq) => (
                    <div key={faq.id}>
                      <button
                        type="button"
                        className="np-list-item"
                        onClick={() => onFaqClick(faq)}
                      >
                        <span>{faq.question}</span>
                        <ChevronRight size={16} />
                      </button>
                      {openFaq === faq.id && (
                        <div className="np-faq-answer">{faq.answer}</div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="np-section">
                  <div className="np-section__head">
                    <span className="np-section__icon">
                      <Grid2x2 size={15} />
                    </span>
                    <h3 className="np-section__title">Channels</h3>
                  </div>
                  {widgetConfig.channels.map((channel) => (
                    <button
                      key={channel.id}
                      type="button"
                      className="np-channel-item"
                      onClick={() => openChannel(channel.type)}
                    >
                      <span className="np-channel-item__icon">
                        {channel.type === 'whatsapp' ? (
                          <WhatsAppIcon />
                        ) : (
                          <InstagramIcon />
                        )}
                      </span>
                      <span className="np-channel-item__label">{channel.label}</span>
                      <ArrowUpRight size={16} className="np-channel-item__arrow" />
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="np-chat-view">
                <div className="np-messages">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`np-msg ${msg.role}`}>
                      {msg.text}
                    </div>
                  ))}
                  {sending && (
                    <div className="np-msg bot np-msg--typing" aria-live="polite">
                      <span />
                      <span />
                      <span />
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                  <div className="np-quick">
                    <button
                      type="button"
                      disabled={sending}
                      onClick={() => pushUser('Speak with team member')}
                    >
                      Speak with team member
                    </button>
                    {faqs.slice(0, 2).map((faq) => (
                      <button
                        key={faq.id}
                        type="button"
                        disabled={sending}
                        onClick={() => onFaqClick(faq)}
                      >
                        {faq.question}
                      </button>
                    ))}
                  </div>
                </div>
                <form
                  className="np-composer"
                  onSubmit={(e) => {
                    e.preventDefault()
                    pushUser(draft)
                  }}
                >
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Type your message..."
                    disabled={sending}
                  />
                  <button type="submit" aria-label="Send" disabled={sending}>
                    <Send size={16} />
                  </button>
                </form>
              </div>
            )}
          </div>

          {!isPage && (
            <button
              type="button"
              className="np-minimize"
              aria-label="Minimize chat"
              onClick={closePanel}
            >
              <ChevronDown size={22} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
