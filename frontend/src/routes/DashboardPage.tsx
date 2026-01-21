import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Users, Ticket, CreditCard, Activity } from 'lucide-react'
import { format } from 'date-fns'

interface User {
  id: string
  email: string
  role: string
  status: string
  createdAt: string
}

interface Ticket {
  id: string
  title: string
  status: string
  priority: string
  createdAt: string
}

interface Subscription {
  id: string
  plan: string
  status: string
  price: number
  createdAt: string
}

interface ActivityLog {
  id: string
  action: string
  actorType: string
  entityType: string
  createdAt: string
}

export function DashboardPage() {
  const { data: usersData } = useQuery({
    queryKey: ['users', 'dashboard'],
    queryFn: () => api.get<{ users: User[] }>('/users?limit=5'),
  })

  const { data: ticketsData } = useQuery({
    queryKey: ['tickets', 'dashboard'],
    queryFn: () => api.get<{ tickets: Ticket[] }>('/tickets?limit=5'),
  })

  const { data: subscriptionsData } = useQuery({
    queryKey: ['subscriptions', 'dashboard'],
    queryFn: () => api.get<{ subscriptions: Subscription[] }>('/subscriptions?limit=5'),
  })

  const { data: activityData } = useQuery({
    queryKey: ['activity', 'dashboard'],
    queryFn: () => api.get<{ logs: ActivityLog[] }>('/activity?limit=5'),
  })

  const stats = [
    {
      title: 'Total Users',
      value: usersData?.users.length || 0,
      icon: Users,
      description: 'Recent users',
    },
    {
      title: 'Open Tickets',
      value: ticketsData?.tickets.filter((t) => t.status === 'OPEN').length || 0,
      icon: Ticket,
      description: 'Active support tickets',
    },
    {
      title: 'Active Subscriptions',
      value: subscriptionsData?.subscriptions.filter((s) => s.status === 'ACTIVE').length || 0,
      icon: CreditCard,
      description: 'Active subscriptions',
    },
    {
      title: 'Recent Activity',
      value: activityData?.logs.length || 0,
      icon: Activity,
      description: 'Latest activity logs',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your admin dashboard</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>Latest registered users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {usersData?.users.map((user) => (
                <div key={user.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{user.email}</span>
                  <span className="text-muted-foreground">
                    {format(new Date(user.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
              ))}
              {(!usersData?.users || usersData.users.length === 0) && (
                <p className="text-sm text-muted-foreground">No users found</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Tickets</CardTitle>
            <CardDescription>Latest support tickets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ticketsData?.tickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{ticket.title}</span>
                  <span className="text-muted-foreground">
                    {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
              ))}
              {(!ticketsData?.tickets || ticketsData.tickets.length === 0) && (
                <p className="text-sm text-muted-foreground">No tickets found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
