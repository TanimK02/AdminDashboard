import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useToast } from '../components/ToastProvider'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Button } from '../components/ui/button'
import { Select } from '../components/ui/select'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { format } from 'date-fns'
import { Checkbox } from '../components/ui/checkbox'

interface User {
  id: string
  email: string
  role: 'ADMIN' | 'USER'
  status: 'ACTIVE' | 'SUSPENDED'
  createdAt: string
  lastLogin: string | null
}

export function UsersPage() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [cursor, setCursor] = useState<string | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [bulkUpdateOpen, setBulkUpdateOpen] = useState(false)
  const [bulkStatus, setBulkStatus] = useState<'ACTIVE' | 'SUSPENDED'>('ACTIVE')
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const { data, isLoading, error } = useQuery({
    queryKey: ['users', statusFilter, roleFilter, cursor],
    queryFn: () => {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (roleFilter) params.append('role', roleFilter)
      if (cursor) params.append('cursor', cursor)
      params.append('limit', '10')
      return api.get<{ users: User[] }>(`/users?${params.toString()}`)
    },
  })

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: string }) =>
      api.patch<{ user: User }>(`/users/${userId}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      showToast('User updated', 'User status has been updated successfully')
    },
    onError: (error: Error) => {
      showToast('Update failed', error.message, 'destructive')
    },
  })

  const bulkUpdateMutation = useMutation({
    mutationFn: ({ userIds, status }: { userIds: string[]; status: string }) =>
      api.patch<{ updatedCount: number }>('/users/bulk', { userIds, status }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setSelectedUsers(new Set())
      setBulkUpdateOpen(false)
      showToast('Bulk update successful', `${data.updatedCount} users updated`)
    },
    onError: (error: Error) => {
      showToast('Bulk update failed', error.message, 'destructive')
    },
  })

  const handleBulkUpdate = () => {
    if (selectedUsers.size === 0) return
    bulkUpdateMutation.mutate({
      userIds: Array.from(selectedUsers),
      status: bulkStatus,
    })
  }

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedUsers.size === data?.users.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(data?.users.map((u) => u.id) || []))
    }
  }

  const users = data?.users || []
  const lastUserId = users.length > 0 ? users[users.length - 1].id : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage user accounts and status</p>
        </div>
        {selectedUsers.size > 0 && (
          <Button onClick={() => setBulkUpdateOpen(true)}>
            Bulk Update ({selectedUsers.size})
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
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </Select>
        <Select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value)
            setCursor(null)
          }}
        >
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="USER">User</option>
        </Select>
      </div>

      {isLoading && <div className="text-center py-8">Loading...</div>}
      {error && (
        <div className="text-center py-8 text-destructive">
          Error: {error instanceof Error ? error.message : 'Failed to load users'}
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
                      checked={selectedUsers.size === users.length && users.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.has(user.id)}
                          onCheckedChange={() => handleSelectUser(user.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.status === 'ACTIVE' ? 'default' : 'destructive'}
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(user.createdAt), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        {user.lastLogin
                          ? format(new Date(user.lastLogin), 'MMM d, yyyy')
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.status}
                          onChange={(e) =>
                            updateUserMutation.mutate({
                              userId: user.id,
                              status: e.target.value,
                            })
                          }
                          className="w-32"
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="SUSPENDED">Suspended</option>
                        </Select>
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
              onClick={() => setCursor(lastUserId || null)}
              disabled={!lastUserId || users.length < 10}
            >
              Next Page
            </Button>
          </div>
        </>
      )}

      <Dialog open={bulkUpdateOpen} onOpenChange={setBulkUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Update Users</DialogTitle>
            <DialogDescription>
              Update status for {selectedUsers.size} selected user(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as 'ACTIVE' | 'SUSPENDED')}
            >
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
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
    </div>
  )
}
