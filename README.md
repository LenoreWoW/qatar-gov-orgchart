# Qatar Government Organization Chart System

A comprehensive organizational chart management system designed for Qatar Government ministries and departments.

## Features

- **Interactive Organization Chart**: Visual representation of governmental hierarchies
- **Multi-language Support**: Arabic and English with RTL support
- **Role-based Access Control**: Admin, Planner, and HR user roles
- **Position Management**: Create, edit, and manage government positions
- **Attribute Management**: Assign responsibilities, qualifications, and other attributes to positions
- **Real-time Dashboard**: Statistics and insights into organizational structure
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React i18next** for internationalization
- **Lucide React** for icons

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **PostgreSQL** database
- **JWT** authentication
- **Bcrypt** for password hashing
- **CORS** enabled for frontend integration

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd qatar-gov-orgchart
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   cd frontend
   npm install

   # Backend
   cd ../backend
   npm install
   ```

3. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb qatar_gov_orgchart

   # Run schema
   psql -d qatar_gov_orgchart -f database/schema.sql
   ```

4. **Environment Configuration**
   ```bash
   # Copy and configure backend environment
   cd backend
   cp .env.example .env
   # Edit .env with your database credentials
   ```

5. **Start Development Servers**
   ```bash
   # Backend (Terminal 1)
   cd backend
   npm run dev

   # Frontend (Terminal 2)
   cd frontend
   npm run dev
   ```

## Deployment

### Frontend (Netlify)
1. Build the frontend: `cd frontend && npm run build`
2. Deploy the `dist` directory to Netlify

### Backend (Production)
1. Set production environment variables
2. Run: `npm run build && npm start`

## User Roles

- **Admin**: Full system access, user management, all CRUD operations
- **Planner**: Create and manage positions, view organization charts
- **HR**: View-only access to positions and organizational data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is developed for Qatar Government internal use.

## Architecture

```
qatar-gov-orgchart/
├── frontend/          # React TypeScript frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # React context providers
│   │   ├── services/      # API service layer
│   │   ├── types/         # TypeScript type definitions
│   │   └── utils/         # Helper utilities
├── backend/           # Node.js Express backend
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   └── utils/         # Helper utilities
└── database/          # Database schema and scripts
    └── schema.sql     # PostgreSQL database schema
```