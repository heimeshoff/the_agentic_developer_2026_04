import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import { formatEur } from './format'

const today = () => new Date().toISOString().slice(0, 10)

interface EditState {
  id: number
  amount: string
  date: string
  note: string
  type: 'income' | 'expense'
}

function App() {
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(today())
  const [note, setNote] = useState('')
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [editState, setEditState] = useState<EditState | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const transactions = useLiveQuery(async () => {
    const rows = await db.transactions.orderBy('date').reverse().toArray()
    // Secondary sort: for same date, newest id first
    rows.sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1
      return (b.id ?? 0) - (a.id ?? 0)
    })
    return rows
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = parseFloat(amount)
    if (isNaN(parsed)) return
    await db.transactions.add({ amount: parsed, date, note, type })
    setAmount('')
    setDate(today())
    setNote('')
    setType('expense')
  }

  function startEdit(tx: { id?: number; amount: number; date: string; note: string; type: 'income' | 'expense' }) {
    setEditState({
      id: tx.id!,
      amount: String(tx.amount),
      date: tx.date,
      note: tx.note,
      type: tx.type,
    })
  }

  async function handleSave() {
    if (!editState) return
    const parsed = parseFloat(editState.amount)
    if (isNaN(parsed)) return
    await db.transactions.update(editState.id, {
      amount: parsed,
      date: editState.date,
      note: editState.note,
      type: editState.type,
    })
    setEditState(null)
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    setImportError(null)
    const file = e.target.files?.[0]
    if (!file) return

    // Reset the input so the same file can be re-imported
    if (fileInputRef.current) fileInputRef.current.value = ''

    let parsed: unknown
    try {
      const text = await file.text()
      parsed = JSON.parse(text)
    } catch {
      setImportError('Could not parse file: invalid JSON.')
      return
    }

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      (parsed as Record<string, unknown>).version !== 1 ||
      !Array.isArray((parsed as Record<string, unknown>).transactions)
    ) {
      setImportError('Invalid format: expected { version: 1, transactions: [...] }.')
      return
    }

    const { transactions } = parsed as { version: 1; transactions: unknown[] }

    const confirmed = window.confirm(
      `This will replace all current data with ${transactions.length} transaction(s) from the file. Continue?`
    )
    if (!confirmed) return

    await db.transactions.clear()
    await db.transactions.bulkAdd(
      transactions as Parameters<typeof db.transactions.bulkAdd>[0]
    )
  }

  async function handleExport() {
    const rows = await db.transactions.toArray()
    const transactions = rows.map(({ id, amount, date, note, type }) => ({ id, amount, date, note, type }))
    const payload = { version: 1, transactions }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'snowball-export.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: '600px' }}>
      <h1>Snowball</h1>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={handleExport}
          style={{ background: '#1a5276', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.4rem 0.9rem', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Export JSON
        </button>
        <button
          onClick={() => { setImportError(null); fileInputRef.current?.click() }}
          style={{ background: '#145a32', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.4rem 0.9rem', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Import JSON
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleImport}
        />
        {importError && (
          <span style={{ color: '#b00', fontSize: '0.9rem' }}>{importError}</span>
        )}
      </div>

      <h2>Add Transaction</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Amount:{' '}
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
              style={{ width: '120px' }}
            />
          </label>
        </div>
        <div style={{ marginTop: '0.5rem' }}>
          <label>
            Date:{' '}
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </label>
        </div>
        <div style={{ marginTop: '0.5rem' }}>
          <label>
            Note:{' '}
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              style={{ width: '240px' }}
            />
          </label>
        </div>
        <div style={{ marginTop: '0.5rem' }}>
          <label>
            Type:{' '}
            <select value={type} onChange={e => setType(e.target.value as 'income' | 'expense')}>
              <option value="income">income</option>
              <option value="expense">expense</option>
            </select>
          </label>
        </div>
        <div style={{ marginTop: '0.75rem' }}>
          <button type="submit">Add</button>
        </div>
      </form>

      <h2 style={{ marginTop: '2rem' }}>Transactions</h2>
      {transactions === undefined && <p>Loading…</p>}
      {transactions && transactions.length === 0 && <p>No transactions yet.</p>}
      {transactions && transactions.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ccc', textAlign: 'left' }}>
              <th style={{ padding: '0.4rem 0.5rem' }}>Date</th>
              <th style={{ padding: '0.4rem 0.5rem' }}>Type</th>
              <th style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>Amount</th>
              <th style={{ padding: '0.4rem 0.5rem' }}>Note</th>
              <th style={{ padding: '0.4rem 0.5rem' }}></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => {
              const isEditing = editState?.id === tx.id
              if (isEditing && editState) {
                return (
                  <tr key={tx.id} style={{ borderBottom: '1px solid #eee', background: '#fafaf0' }}>
                    <td style={{ padding: '0.4rem 0.5rem' }}>
                      <input
                        type="date"
                        value={editState.date}
                        onChange={e => setEditState({ ...editState, date: e.target.value })}
                        style={{ width: '130px' }}
                      />
                    </td>
                    <td style={{ padding: '0.4rem 0.5rem' }}>
                      <select
                        value={editState.type}
                        onChange={e => setEditState({ ...editState, type: e.target.value as 'income' | 'expense' })}
                      >
                        <option value="income">income</option>
                        <option value="expense">expense</option>
                      </select>
                    </td>
                    <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>
                      <input
                        type="number"
                        step="0.01"
                        value={editState.amount}
                        onChange={e => setEditState({ ...editState, amount: e.target.value })}
                        style={{ width: '100px', textAlign: 'right' }}
                      />
                    </td>
                    <td style={{ padding: '0.4rem 0.5rem' }}>
                      <input
                        type="text"
                        value={editState.note}
                        onChange={e => setEditState({ ...editState, note: e.target.value })}
                        style={{ width: '180px' }}
                      />
                    </td>
                    <td style={{ padding: '0.4rem 0.5rem', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={handleSave}
                        style={{ background: 'none', border: '1px solid #2a7a2a', color: '#2a7a2a', borderRadius: '3px', cursor: 'pointer', padding: '0.1rem 0.4rem', marginRight: '0.25rem' }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditState(null)}
                        style={{ background: 'none', border: '1px solid #888', color: '#555', borderRadius: '3px', cursor: 'pointer', padding: '0.1rem 0.4rem' }}
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                )
              }
              return (
                <tr key={tx.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.4rem 0.5rem' }}>{tx.date}</td>
                  <td style={{ padding: '0.4rem 0.5rem', color: tx.type === 'income' ? '#2a7a2a' : '#b00' }}>
                    {tx.type}
                  </td>
                  <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {tx.type === 'expense' ? '−' : '+'}{formatEur(Math.abs(tx.amount))}
                  </td>
                  <td style={{ padding: '0.4rem 0.5rem', color: tx.note ? 'inherit' : '#aaa' }}>
                    {tx.note || '(no note)'}
                  </td>
                  <td style={{ padding: '0.4rem 0.5rem', whiteSpace: 'nowrap' }}>
                    <button
                      onClick={() => startEdit(tx)}
                      style={{ background: 'none', border: '1px solid #555', color: '#333', borderRadius: '3px', cursor: 'pointer', padding: '0.1rem 0.4rem', marginRight: '0.25rem' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => db.transactions.delete(tx.id!)}
                      style={{ color: '#b00', background: 'none', border: '1px solid #b00', borderRadius: '3px', cursor: 'pointer', padding: '0.1rem 0.4rem' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default App
