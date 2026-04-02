'use client'
import { useState } from 'react'

const SUGGESTED = [
  'What is the biggest risk in my portfolio today?',
  'Explain the MACD signal for the selected ticker',
  'Is this a good entry point?',
]

export function AskClaude({ ticker }: { ticker: string }) {
  const [question, setQuestion] = useState('')
  const [url, setUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [showInputs, setShowInputs] = useState(false)

  async function ask(q: string) {
    setLoading(true)
    setAnswer('')
    const res = await fetch('/api/ask-claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q, ticker, url: url || undefined, notes: notes || undefined }),
    })
    const data = await res.json()
    setAnswer(data.answer ?? data.error ?? 'No response')
    setLoading(false)
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <p className="font-semibold text-sm mb-3">Ask Claude</p>

      <button onClick={() => setShowInputs(!showInputs)} className="text-xs text-blue-400 mb-3 block">
        {showInputs ? 'Hide' : 'Add URL or research notes'}
      </button>

      {showInputs && (
        <div className="space-y-2 mb-3">
          <input
            type="url" value={url} onChange={e => setUrl(e.target.value)}
            placeholder="Paste a public URL (Yahoo Finance, CNBC, etc.)"
            className="w-full bg-gray-800 text-white text-xs px-3 py-2 rounded border border-gray-700"
          />
          <textarea
            value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Paste article text or your own research notes (not stored)"
            rows={3}
            className="w-full bg-gray-800 text-white text-xs px-3 py-2 rounded border border-gray-700 resize-none"
          />
        </div>
      )}

      {answer && (
        <div className="bg-gray-800 rounded p-3 text-xs text-gray-300 leading-relaxed mb-3 whitespace-pre-wrap">
          {answer}
        </div>
      )}

      <div className="flex gap-2 flex-wrap mb-3">
        {SUGGESTED.map(s => (
          <button key={s} onClick={() => ask(s)}
            className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded-full">
            {s}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text" value={question} onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && question && ask(question)}
          placeholder="Ask anything about today's market…"
          className="flex-1 bg-gray-800 text-white text-xs px-3 py-2 rounded border border-gray-700"
        />
        <button onClick={() => question && ask(question)} disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded disabled:opacity-50">
          {loading ? '…' : 'Ask'}
        </button>
      </div>
    </div>
  )
}
