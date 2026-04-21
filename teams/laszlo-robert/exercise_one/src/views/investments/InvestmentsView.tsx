import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, sumBy } from '@/lib/utils'
import type { Investment } from '@/types'
import { InvestmentForm } from './InvestmentForm'

type Props = {
  investments: Investment[]
  onAdd: (inv: Omit<Investment, 'id'>) => void
  onUpdatePrice: (id: string, price: number) => void
  onDelete: (id: string) => void
}

const ASSET_TYPE_COLORS: Record<Investment['assetType'], string> = {
  stock: 'bg-blue-100 text-blue-800',
  etf: 'bg-purple-100 text-purple-800',
  crypto: 'bg-orange-100 text-orange-800',
  other: 'bg-gray-100 text-gray-800',
}

export function InvestmentsView({ investments, onAdd, onUpdatePrice, onDelete }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState('')

  const totalInvested = sumBy(investments, i => i.purchasePrice * i.shares)
  const totalCurrent = sumBy(investments, i => i.currentPrice * i.shares)
  const totalGain = totalCurrent - totalInvested
  const gainPct = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0

  const handlePriceSave = (id: string) => {
    if (editPrice) onUpdatePrice(id, parseFloat(editPrice))
    setEditingId(null)
    setEditPrice('')
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Invested</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatCurrency(totalInvested)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Current Value</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatCurrency(totalCurrent)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Gain / Loss</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${totalGain >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {formatCurrency(totalGain)} <span className="text-base">({gainPct.toFixed(1)}%)</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Add Investment</CardTitle></CardHeader>
        <CardContent><InvestmentForm onAdd={onAdd} /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Portfolio</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Shares</TableHead>
                <TableHead className="text-right">Buy Price</TableHead>
                <TableHead className="text-right">Current Price</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">Gain / Loss</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {investments.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-6">No investments yet.</TableCell></TableRow>
              )}
              {investments.map(inv => {
                const gain = (inv.currentPrice - inv.purchasePrice) * inv.shares
                const gainP = ((inv.currentPrice - inv.purchasePrice) / inv.purchasePrice) * 100
                return (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.name}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ASSET_TYPE_COLORS[inv.assetType]}`}>
                        {inv.assetType}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{inv.shares}</TableCell>
                    <TableCell className="text-right">{formatCurrency(inv.purchasePrice)}</TableCell>
                    <TableCell className="text-right">
                      {editingId === inv.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <Input
                            className="w-24 h-7 text-sm"
                            type="number" min="0" step="0.01"
                            defaultValue={inv.currentPrice}
                            onChange={e => setEditPrice(e.target.value)}
                            autoFocus
                          />
                          <Button size="sm" className="h-7 px-2" onClick={() => handlePriceSave(inv.id)}>OK</Button>
                        </div>
                      ) : (
                        <button
                          className="flex items-center gap-1 ml-auto text-sm hover:underline"
                          onClick={() => { setEditingId(inv.id); setEditPrice(String(inv.currentPrice)) }}
                        >
                          {formatCurrency(inv.currentPrice)} <Pencil className="h-3 w-3 text-muted-foreground" />
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(inv.currentPrice * inv.shares)}</TableCell>
                    <TableCell className={`text-right font-medium ${gain >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                      {formatCurrency(gain)} ({gainP.toFixed(1)}%)
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(inv.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
