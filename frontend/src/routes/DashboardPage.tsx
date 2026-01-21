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

interface UserStats {
  active: number
  suspended: number
  admins: number
  users: number
}

interface Ticket {
  id: string
  title: string
  status: string
  priority: string
  createdAt: string
}

interface TicketStats {
  open: number
  resolved: number
  urgent: number
}

interface Subscription {
  id: string
  plan: string
  status: string
  price: number
  createdAt: string
}

interface SubscriptionStats {
  active: number
  canceled: number
  failed: number
}

interface ActivityLog {
  id: string
  action: string
  actorType: string
  entityType: string
  createdAt: string
}

interface ActivityStats {
  last24h: number
}

export function DashboardPage() {
  const { data: usersData } = useQuery({
    queryKey: ['users', 'dashboard'],
    queryFn: () => api.get<{ users: User[] }>('/users?limit=5'),
  })

  const { data: userStatsData } = useQuery({
    queryKey: ['users', 'stats'],
    queryFn: () => api.get<{ stats: UserStats }>('/users/stats'),
  })

  const { data: ticketsData } = useQuery({
    queryKey: ['tickets', 'dashboard'],
    queryFn: () => api.get<{ tickets: Ticket[] }>('/tickets?limit=5'),
  })

  const { data: ticketStatsData } = useQuery({
    queryKey: ['tickets', 'stats'],
    queryFn: () => api.get<{ stats: TicketStats }>('/tickets/stats'),
  })

  const { data: subscriptionsData } = useQuery({
    queryKey: ['subscriptions', 'dashboard'],
    queryFn: () => api.get<{ subscriptions: Subscription[] }>('/subscriptions?limit=5'),
  })

  const { data: subscriptionStatsData } = useQuery({
    queryKey: ['subscriptions', 'stats'],
    queryFn: () => api.get<{ stats: SubscriptionStats }>('/subscriptions/stats'),
  })

  const { data: activityData } = useQuery({
    queryKey: ['activity', 'dashboard'],
    queryFn: () => api.get<{ logs: ActivityLog[] }>('/activity?limit=5'),
  })

  const { data: activityStatsData } = useQuery({
    queryKey: ['activity', 'stats'],
    queryFn: () => api.get<{ stats: ActivityStats }>('/activity/stats'),
  })

  const stats = [
    {
      title: 'Total Users',
      value:
        (userStatsData?.stats.active ?? 0) +
        (userStatsData?.stats.suspended ?? 0),
      icon: Users,
      description: `${userStatsData?.stats.active ?? 0} active`,
    },
    {
      title: 'Open Tickets',
      value: ticketStatsData?.stats.open || 0,
      icon: Ticket,
      description: 'Open support tickets',
    },
    {
      title: 'Active Subscriptions',
      value: subscriptionStatsData?.stats.active || 0,
      icon: CreditCard,
      description: 'Active subscriptions',
    },
    {
      title: 'Recent Activity',
      value: activityStatsData?.stats.last24h || 0,
      icon: Activity,
      description: 'in last 24h',
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
