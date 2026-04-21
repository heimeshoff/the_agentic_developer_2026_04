import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Investment } from '@/types'

type Props = { onAdd: (inv: Omit<Investment, 'id'>) => void }

export function InvestmentForm({ onAdd }: Props) {
  const [name, setName] = useState('')
  const [assetType, setAssetType] = useState<Investment['assetType']>('stock')
  const [shares, setShares] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [currentPrice, setCurrentPrice] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !shares || !purchasePrice || !currentPrice) return
    onAdd({ name, assetType, shares: parseFloat(shares), purchasePrice: parseFloat(purchasePrice), currentPrice: parseFloat(currentPrice) })
    setName(''); setShares(''); setPurchasePrice(''); setCurrentPrice('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-end flex-wrap">
      <div className="flex flex-col gap-1.5 flex-1 min-w-28">
        <Label htmlFor="inv-name">Name / Ticker</Label>
        <Input id="inv-name" placeholder="e.g. AAPL" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5 w-32">
        <Label>Type</Label>
        <Select value={assetType} onValueChange={v => setAssetType(v as Investment['assetType'])}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="stock">Stock</SelectItem>
            <SelectItem value="etf">ETF</SelectItem>
            <SelectItem value="crypto">Crypto</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5 w-24">
        <Label htmlFor="inv-shares">Shares</Label>
        <Input id="inv-shares" type="number" min="0" step="any" placeholder="0" value={shares} onChange={e => setShares(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5 w-32">
        <Label htmlFor="inv-buy">Buy Price ($)</Label>
        <Input id="inv-buy" type="number" min="0" step="0.01" placeholder="0.00" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5 w-32">
        <Label htmlFor="inv-cur">Current Price ($)</Label>
        <Input id="inv-cur" type="number" min="0" step="0.01" placeholder="0.00" value={currentPrice} onChange={e => setCurrentPrice(e.target.value)} />
      </div>
      <Button type="submit">Add</Button>
    </form>
  )
}
