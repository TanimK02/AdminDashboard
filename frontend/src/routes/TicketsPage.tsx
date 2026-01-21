import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useToast } from '../components/ToastProvider'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Button } from '../components/ui/button'
import { Select } from '../components/ui/select'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { format } from 'date-fns'
import { Checkbox } from '../components/ui/checkbox'

interface Ticket {
  id: string
  userId: string
  title: string
  status: 'OPEN' | 'RESOLVED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  createdAt: string
}

export function TicketsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [priorityFilter, setPriorityFilter] = useState<string>('')
  const [cursor, setCursor] = useState<string | null>(null)
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set())
  const [bulkUpdateOpen, setBulkUpdateOpen] = useState(false)
  const [bulkStatus, setBulkStatus] = useState<'OPEN' | 'RESOLVED'>('RESOLVED')
  const [editTicket, setEditTicket] = useState<Ticket | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editStatus, setEditStatus] = useState<'OPEN' | 'RESOLVED'>('OPEN')
  const [editPriority, setEditPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM')
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const { data, isLoading, error } = useQuery({
    queryKey: ['tickets', statusFilter, priorityFilter, cursor],
    queryFn: () => {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (priorityFilter) params.append('priority', priorityFilter)
      if (cursor) params.append('cursor', cursor)
      params.append('limit', '10')
      return api.get<{ tickets: Ticket[]; nextCursor: string | null }>(`/tickets?${params.toString()}`)
    },
  })

  const updateTicketMutation = useMutation({
    mutationFn: ({ ticketId, updates }: { ticketId: string; updates: Partial<Ticket> }) =>
      api.patch<{ ticket: Ticket }>(`/tickets/${ticketId}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      setEditTicket(null)
      showToast('Ticket updated', 'Ticket has been updated successfully')
    },
    onError: (error: Error) => {
      showToast('Update failed', error.message, 'destructive')
    },
  })

  const bulkUpdateMutation = useMutation({
    mutationFn: ({ ticketIds, status }: { ticketIds: string[]; status: string }) =>
      api.patch<{ updatedCount: number }>('/tickets/bulk', { ticketIds, status }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      setSelectedTickets(new Set())
      setBulkUpdateOpen(false)
      showToast('Bulk update successful', `${data.updatedCount} tickets updated`)
    },
    onError: (error: Error) => {
      showToast('Bulk update failed', error.message, 'destructive')
    },
  })

  const handleBulkUpdate = () => {
    if (selectedTickets.size === 0) return
    bulkUpdateMutation.mutate({
      ticketIds: Array.from(selectedTickets),
      status: bulkStatus,
    })
  }

  const handleSelectTicket = (ticketId: string) => {
    const newSelected = new Set(selectedTickets)
    if (newSelected.has(ticketId)) {
      newSelected.delete(ticketId)
    } else {
      newSelected.add(ticketId)
    }
    setSelectedTickets(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedTickets.size === data?.tickets.length) {
      setSelectedTickets(new Set())
    } else {
      setSelectedTickets(new Set(data?.tickets.map((t) => t.id) || []))
    }
  }

  const handleEdit = (ticket: Ticket) => {
    setEditTicket(ticket)
    setEditTitle(ticket.title)
    setEditStatus(ticket.status)
    setEditPriority(ticket.priority)
  }

  const handleSaveEdit = () => {
    if (!editTicket) return
    updateTicketMutation.mutate({
      ticketId: editTicket.id,
      updates: {
        title: editTitle,
        status: editStatus,
        priority: editPriority,
      },
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'destructive'
      case 'HIGH':
        return 'default'
      case 'MEDIUM':
        return 'secondary'
      case 'LOW':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const tickets = data?.tickets || []
  const nextCursor = data?.nextCursor

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Support Tickets</h1>
          <p className="text-muted-foreground">Manage and resolve support tickets</p>
        </div>
        {selectedTickets.size > 0 && (
          <Button onClick={() => setBulkUpdateOpen(true)}>
            Bulk Update ({selectedTickets.size})
          </Button>
        )}
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
          <option value="OPEN">Open</option>
          <option value="RESOLVED">Resolved</option>
        </Select>
        <Select
          value={priorityFilter}
          onChange={(e) => {
            setPriorityFilter(e.target.value)
            setCursor(null)
          }}
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </Select>
      </div>

      {isLoading && <div className="text-center py-8">Loading...</div>}
      {error && (
        <div className="text-center py-8 text-destructive">
          Error: {error instanceof Error ? error.message : 'Failed to load tickets'}
        </div>
      )}

      {!isLoading && !error && (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedTickets.size === tickets.length && tickets.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No tickets found
                    </TableCell>
                  </TableRow>
                ) : (
                  tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedTickets.has(ticket.id)}
                          onCheckedChange={() => handleSelectTicket(ticket.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{ticket.title}</TableCell>
                      <TableCell>
                        <Badge variant={ticket.status === 'OPEN' ? 'default' : 'secondary'}>
                          {ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityColor(ticket.priority) as any}>
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(ticket.createdAt), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(ticket)}>
                          Edit
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
              onClick={() => setCursor(nextCursor || null)}
              disabled={!nextCursor}
            >
              Next Page
            </Button>
          </div>
        </>
      )}

      <Dialog open={bulkUpdateOpen} onOpenChange={setBulkUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Update Tickets</DialogTitle>
            <DialogDescription>
              Update status for {selectedTickets.size} selected ticket(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as 'OPEN' | 'RESOLVED')}
            >
              <option value="OPEN">Open</option>
              <option value="RESOLVED">Resolved</option>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkUpdateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkUpdate} disabled={bulkUpdateMutation.isPending}>
              {bulkUpdateMutation.isPending ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTicket} onOpenChange={(open) => !open && setEditTicket(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Ticket</DialogTitle>
            <DialogDescription>Update ticket details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Ticket title"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as 'OPEN' | 'RESOLVED')}
              >
                <option value="OPEN">Open</option>
                <option value="RESOLVED">Resolved</option>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select
                value={editPriority}
                onChange={(e) =>
                  setEditPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')
                }
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTicket(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateTicketMutation.isPending}>
              {updateTicketMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
