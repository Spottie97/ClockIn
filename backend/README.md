# ClockIn Backend API

This is the backend API for the ClockIn time tracking system, a modern employee time tracking solution that records work hours, captures verification data, and provides comprehensive reporting.

## Features

- User authentication with JWT
- Role-based access control (employee, manager, admin)
- Shift management (clock in/out, breaks, approval workflow)
- Project time tracking
- Comprehensive reporting
- Department organization
- Verification with photos and geolocation

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Various security middleware (helmet, rate limiting, etc.)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Copy the example environment file:
   ```
   cp .env.example .env
   ```
4. Update the `.env` file with your configuration
5. Start the development server:
   ```
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password

### Shifts
- `POST /api/shifts` - Start a new shift (clock in)
- `PATCH /api/shifts/:id` - End current shift (clock out)
- `POST /api/shifts/break/start` - Start a break during a shift
- `POST /api/shifts/break/end` - End current break
- `GET /api/shifts/employee` - Get current user's shifts
- `GET /api/shifts/active` - Get active shift for current user
- `GET /api/shifts/pending` - Get all pending shifts (for managers/admins)
- `GET /api/shifts/active-employees` - Get currently active employees (for managers/admins)
- `PATCH /api/shifts/:id/approve` - Approve or reject a shift
- `GET /api/shifts/:id` - Get shift by ID

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/employees` - Get all employees (admin/manager)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create a new user (admin only)
- `PATCH /api/users/:id` - Update a user (admin only)
- `DELETE /api/users/:id` - Delete a user (admin only)

### Reports
- `GET /api/reports/generate` - Generate report based on parameters
- `GET /api/reports/employee/:id` - Get employee work summary
- `GET /api/reports/department/:id` - Get department summary

### Projects
- `GET /api/projects` - Get all projects (admin/manager)
- `GET /api/projects/user` - Get projects for current user
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create a new project (admin/manager)
- `PATCH /api/projects/:id` - Update a project
- `DELETE /api/projects/:id` - Delete a project (admin only)
- `POST /api/projects/:id/team` - Add team members to project
- `DELETE /api/projects/:id/team/:memberId` - Remove team member from project
- `GET /api/projects/:id/report` - Get project time report

## Testing

Run tests with:
```
npm test
```

## Deployment

For production deployment:
1. Set NODE_ENV to 'production' in your .env file
2. Ensure you have a secure JWT_SECRET
3. Configure proper MongoDB connection string
4. Start the server with `npm start`

## License

This project is licensed under the MIT License.