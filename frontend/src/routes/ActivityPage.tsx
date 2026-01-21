import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Button } from '../components/ui/button'
import { Select } from '../components/ui/select'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { format } from 'date-fns'

interface ActivityLog {
  id: string
  actorType: 'USER' | 'ADMIN' | 'SYSTEM'
  actorId: string | null
  action: string
  entityType: 'USER' | 'SUBSCRIPTION' | 'TICKET' | 'SYSTEM'
  entityId: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

export function ActivityPage() {
  const [actorTypeFilter, setActorTypeFilter] = useState<string>('')
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('')
  const [cursor, setCursor] = useState<string | null>(null)
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['activity', actorTypeFilter, entityTypeFilter, cursor],
    queryFn: () => {
      const params = new URLSearchParams()
      if (actorTypeFilter) params.append('actorType', actorTypeFilter)
      if (entityTypeFilter) params.append('entityType', entityTypeFilter)
      if (cursor) params.append('cursor', cursor)
      params.append('limit', '10')
      return api.get<{ logs: ActivityLog[] }>(`/activity?${params.toString()}`)
    },
  })

  const logs = data?.logs || []
  const lastLogId = logs.length > 0 ? logs[logs.length - 1].id : null

  const getActorTypeColor = (actorType: string) => {
    switch (actorType) {
      case 'ADMIN':
        return 'default'
      case 'USER':
        return 'secondary'
      case 'SYSTEM':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const getEntityTypeColor = (entityType: string) => {
    switch (entityType) {
      case 'USER':
        return 'default'
      case 'TICKET':
        return 'secondary'
      case 'SUBSCRIPTION':
        return 'outline'
      case 'SYSTEM':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Activity Logs</h1>
        <p className="text-muted-foreground">View system activity and audit logs</p>
      </div>

      <div className="flex gap-4">
        <Select
          value={actorTypeFilter}
          onChange={(e) => {
            setActorTypeFilter(e.target.value)
            setCursor(null)
          }}
        >
          <option value="">All Actor Types</option>
          <option value="ADMIN">Admin</option>
          <option value="USER">User</option>
          <option value="SYSTEM">System</option>
        </Select>
        <Select
          value={entityTypeFilter}
          onChange={(e) => {
            setEntityTypeFilter(e.target.value)
            setCursor(null)
          }}
        >
          <option value="">All Entity Types</option>
          <option value="USER">User</option>
          <option value="TICKET">Ticket</option>
          <option value="SUBSCRIPTION">Subscription</option>
          <option value="SYSTEM">System</option>
        </Select>
      </div>

      {isLoading && <div className="text-center py-8">Loading...</div>}
      {error && (
        <div className="text-center py-8 text-destructive">
          Error: {error instanceof Error ? error.message : 'Failed to load activity logs'}
        </div>
      )}

      {!isLoading && !error && (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Actor Type</TableHead>
                  <TableHead>Entity Type</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No activity logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.action}</TableCell>
                      <TableCell>
                        <Badge variant={getActorTypeColor(log.actorType) as any}>
                          {log.actorType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getEntityTypeColor(log.entityType) as any}>
                          {log.entityType}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(log.createdAt), 'MMM d, yyyy HH:mm')}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
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
              onClick={() => setCursor(lastLogId || null)}
              disabled={!lastLogId || logs.length < 10}
            >
              Next Page
            </Button>
          </div>
        </>
      )}

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activity Log Details</DialogTitle>
            <DialogDescription>View detailed activity log information</DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">ID</p>
                <p className="text-sm text-muted-foreground">{selectedLog.id}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Action</p>
                <p className="text-sm text-muted-foreground">{selectedLog.action}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Actor Type</p>
                <Badge variant={getActorTypeColor(selectedLog.actorType) as any}>
                  {selectedLog.actorType}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Actor ID</p>
                <p className="text-sm text-muted-foreground">{selectedLog.actorId || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Entity Type</p>
                <Badge variant={getEntityTypeColor(selectedLog.entityType) as any}>
                  {selectedLog.entityType}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Entity ID</p>
                <p className="text-sm text-muted-foreground">{selectedLog.entityId || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedLog.createdAt), 'PPpp')}
                </p>
              </div>
              {selectedLog.metadata && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Metadata</p>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
