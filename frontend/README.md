# Admin Dashboard Frontend

A modern admin dashboard built with Vite, React, TypeScript, and Tailwind CSS.

## Features

- **Authentication**: Password-based admin login with JWT token management
- **User Management**: View, filter, and update user statuses (bulk operations supported)
- **Support Tickets**: Manage tickets with status and priority filters, edit tickets, and bulk updates
- **Subscriptions**: View and filter user subscriptions with detailed information
- **Activity Logs**: Monitor system activity with comprehensive filtering options
- **Dashboard**: Overview with quick stats and recent activity

## Tech Stack

- **Vite** - Build tool and dev server
- **React 18** - UI library
- **TypeScript** - Type safety
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and caching
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **React Hook Form** - Form management
- **Zod** - Schema validation

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the frontend directory:
```
VITE_API_BASE_URL=http://localhost:5000
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port Vite assigns).

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── ui/         # shadcn/ui components
│   │   ├── Layout.tsx  # Main layout with sidebar
│   │   ├── Sidebar.tsx # Navigation sidebar
│   │   └── Topbar.tsx  # Top navigation bar
│   ├── routes/         # Page components
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── UsersPage.tsx
│   │   ├── TicketsPage.tsx
│   │   ├── SubscriptionsPage.tsx
│   │   └── ActivityPage.tsx
│   ├── auth/           # Authentication logic
│   │   └── AuthProvider.tsx
│   ├── lib/            # Utilities
│   │   ├── api.ts      # API client
│   │   └── utils.ts    # Helper functions
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
```

## API Integration

The frontend communicates with the backend API at the URL specified in `VITE_API_BASE_URL`. All API requests automatically include the JWT token from localStorage in the Authorization header.

### Endpoints Used

- `POST /api/auth/login` - Admin login
- `GET /users` - Get users (with filters and pagination)
- `PATCH /users/:id` - Update user status
- `PATCH /users/bulk` - Bulk update user statuses
- `GET /tickets` - Get support tickets (with filters and pagination)
- `PATCH /tickets/:id` - Update ticket
- `PATCH /tickets/bulk` - Bulk update tickets
- `GET /subscriptions` - Get subscriptions (with filters and pagination)
- `GET /activity` - Get activity logs (with filters and pagination)

## Authentication

The app uses JWT tokens stored in localStorage. When a user logs in, the token is saved and automatically included in all API requests. If a request returns 401 (Unauthorized), the user is automatically logged out and redirected to the login page.

## Development

- The app uses React Router for client-side routing
- TanStack Query handles all data fetching with automatic caching and refetching
- Toast notifications are used for user feedback
- All forms use React Hook Form with Zod validation
