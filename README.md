# OAN Pulse - Time Tracking Application

A modern, professional time tracking application built with React and Oracle Database, designed to replace costly solutions like Harvest.

## 🚀 Features

- **Intuitive Time Tracking** - Beautiful, space-efficient interface that surpasses Harvest
- **Unified Timer + Manual Entry** - Switch seamlessly between timer and manual time entry
- **Week Calendar View** - Modern week navigation with visual day selection
- **Project & Task Management** - Organize work by projects and tasks
- **Client Management** - Track clients and their projects
- **Real-time Timer** - Live timer with auto-save functionality
- **Dashboard Analytics** - Overview of time tracked and project status
- **Oracle Database Backend** - Robust, enterprise-grade data storage
- **REST API** - Oracle APEX REST services for seamless data access

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Vite** - Lightning-fast build tool
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client for API calls
- **Modern CSS** - Harvest-inspired design system

### Backend
- **Oracle Database** - Enterprise-grade database
- **Oracle APEX** - REST Data Services (ORDS)
- **PL/SQL** - Database logic and triggers

## 📦 Project Structure

```
OAN_PULSE/
├── database_setup.sql              # Complete database schema
├── oan-pulse-frontend/            # React frontend application
│   ├── src/
│   │   ├── components/           # Reusable components
│   │   │   ├── common/          # Layout components
│   │   │   ├── clients/         # Client management
│   │   │   ├── projects/        # Project management
│   │   │   └── time-tracking/   # Time tracking components
│   │   ├── pages/               # Page components
│   │   ├── services/            # API services
│   │   ├── App.jsx              # Main app component
│   │   ├── main.jsx             # Entry point
│   │   └── index.css            # Global styles
│   ├── .env                      # Environment variables
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
└── README.md
```

## 🚦 Getting Started

### Prerequisites
- Node.js 16+ and npm
- Oracle Database (or Oracle Cloud)
- Oracle APEX (for REST services)

### Database Setup

1. Connect to your Oracle Database
2. Run the complete setup script:
```sql
@database_setup.sql
```

This will create:
- All tables (users, clients, projects, tasks, time_entries, etc.)
- Indexes and constraints
- Triggers for timestamps
- Views for reporting
- REST API endpoints via ORDS

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd oan-pulse-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
# Update .env with your API endpoint
VITE_API_BASE_URL=https://your-apex-instance.com/ords/your_schema
VITE_APP_NAME=OAN Pulse
```

4. Start the development server:
```bash
npm run dev
```

5. Open http://localhost:3000

## 🎨 Features Overview

### Time Tracking
- **Week Calendar** - Visual navigation with day selection
- **Add Time Entry** - Unified form with timer/manual toggle
- **Live Timer** - Real-time tracking with project selection
- **Entry Cards** - Clean, color-coded time entries
- **Daily Total** - Track progress towards daily goals

### Project Management
- Create and manage projects
- Assign to clients
- Set budgets and hourly rates
- Track billable/non-billable time

### Client Management
- Maintain client database
- Link projects to clients
- Track client-specific metrics

### Dashboard
- Summary statistics
- Recent activity
- Quick access to key features

## 📊 Database Schema

Key tables:
- `oan_pulse_users` - User authentication and profiles
- `oan_pulse_clients` - Client information
- `oan_pulse_projects` - Project details and budgets
- `oan_pulse_tasks` - Task breakdown
- `oan_pulse_time_entries` - Time tracking records
- `oan_pulse_timer_sessions` - Active timer sessions
- `oan_pulse_expenses` - Expense tracking

All objects are prefixed with `oan_pulse_` for consistency.

## 🔒 Security

- JWT-based authentication (planned)
- Role-based access control (ADMIN, MANAGER, EMPLOYEE)
- Secure API endpoints
- Password hashing
- Input validation

## 🚀 Deployment

### Frontend (Vite)
```bash
npm run build
```
Deploy the `dist` folder to your hosting service.

### Backend
Oracle Database and APEX are already production-ready.
Configure APEX REST services for production use.

## 📝 Future Enhancements

- [ ] User authentication and authorization
- [ ] Reports and analytics
- [ ] Export functionality (CSV, PDF)
- [ ] Expense tracking
- [ ] Invoicing
- [ ] Team management
- [ ] Mobile responsive design
- [ ] Dark mode
- [ ] Notifications
- [ ] Integration with other tools

## 👨‍💻 Development

Built with modern best practices:
- Component-based architecture
- Separation of concerns
- RESTful API design
- Responsive UI
- Clean, maintainable code

## 📄 License

Proprietary - All rights reserved

## 🤝 Contributing

This is a private project. Contact the maintainer for contribution guidelines.

## 📧 Contact

For questions or support, contact the development team.

---

**OAN Pulse** - The modern way to track time. Built to replace Harvest with a better, more affordable solution.
