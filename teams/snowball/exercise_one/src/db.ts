import Dexie, { type Table } from 'dexie'

export interface Transaction {
  id?: number
  amount: number
  date: string // ISO date, e.g. "2026-04-23"
  note: string
  type: 'income' | 'expense'
}

class SnowballDB extends Dexie {
  transactions!: Table<Transaction, number>

  constructor() {
    super('snowball')
    this.version(1).stores({
      transactions: '++id, date, type',
    })
  }
}

export const db = new SnowballDB()
