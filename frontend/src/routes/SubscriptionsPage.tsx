import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Button } from '../components/ui/button'
import { Select } from '../components/ui/select'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { format } from 'date-fns'

interface Subscription {
  id: string
  userId: string
  plan: string
  price: number
  status: 'ACTIVE' | 'CANCELED' | 'FAILED'
  createdAt: string
}

export function SubscriptionsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [cursor, setCursor] = useState<string | null>(null)
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['subscriptions', statusFilter, cursor],
    queryFn: () => {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (cursor) params.append('cursor', cursor)
      params.append('limit', '10')
      return api.get<{ subscriptions: Subscription[] }>(`/subscriptions?${params.toString()}`)
    },
  })

  const subscriptions = data?.subscriptions || []
  const lastSubscriptionId = subscriptions.length > 0 ? subscriptions[subscriptions.length - 1].id : null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default'
      case 'CANCELED':
        return 'secondary'
      case 'FAILED':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscriptions</h1>
        <p className="text-muted-foreground">View and manage user subscriptions</p>
      </div>

      <div className="flex gap-4">
        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setCursor(null)
          }}
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="CANCELED">Canceled</option>
          <option value="FAILED">Failed</option>
        </Select>
      </div>

      {isLoading && <div className="text-center py-8">Loading...</div>}
      {error && (
        <div className="text-center py-8 text-destructive">
          Error: {error instanceof Error ? error.message : 'Failed to load subscriptions'}
        </div>
      )}

      {!isLoading && !error && (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No subscriptions found
                    </TableCell>
                  </TableRow>
                ) : (
                  subscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell className="font-medium">{subscription.plan}</TableCell>
                      <TableCell>${subscription.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(subscription.status) as any}>
                          {subscription.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(subscription.createdAt), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedSubscription(subscription)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setCursor(null)}
              disabled={!cursor}
            >
              First Page
            </Button>
            <Button
              variant="outline"
              onClick={() => setCursor(lastSubscriptionId || null)}
              disabled={!lastSubscriptionId || subscriptions.length < 10}
            >
              Next Page
            </Button>
          </div>
        </>
      )}

      <Dialog open={!!selectedSubscription} onOpenChange={(open) => !open && setSelectedSubscription(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subscription Details</DialogTitle>
            <DialogDescription>View subscription information</DialogDescription>
          </DialogHeader>
          {selectedSubscription && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">ID</p>
                <p className="text-sm text-muted-foreground">{selectedSubscription.id}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">User ID</p>
                <p className="text-sm text-muted-foreground">{selectedSubscription.userId}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Plan</p>
                <p className="text-sm text-muted-foreground">{selectedSubscription.plan}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Price</p>
                <p className="text-sm text-muted-foreground">${selectedSubscription.price.toFixed(2)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Status</p>
                <Badge variant={getStatusColor(selectedSubscription.status) as any}>
                  {selectedSubscription.status}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedSubscription.createdAt), 'PPpp')}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
