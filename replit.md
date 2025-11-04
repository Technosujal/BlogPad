# Personal Blog & Notepad Application

## Overview

A full-stack web application for creating and managing personal blog posts. The application features user authentication, CRUD operations for blog posts, and a clean dashboard interface. Built with Express.js backend serving a vanilla JavaScript frontend, using PostgreSQL for data persistence and bcrypt for secure password hashing.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Technology**: Vanilla JavaScript with HTML5 and CSS3
- **Structure**: Multi-page application with separate HTML files for authentication and dashboard
- **Authentication Flow**: Client-side session management with server-side validation
- **UI Components**: 
  - Login/registration forms with toggle functionality
  - Dashboard with post editor and sidebar list
  - Real-time post management interface

### Backend Architecture
- **Framework**: Express.js server with RESTful API endpoints
- **Session Management**: Express-session middleware with secure cookie configuration
- **Authentication**: Custom authentication middleware with session-based auth
- **Security**: bcrypt password hashing with salt rounds
- **API Structure**: 
  - `/auth/*` routes for user authentication
  - `/api/*` routes for blog post CRUD operations
- **Middleware Stack**: CORS, body-parser, express-session for request processing

### Data Storage
- **Database**: PostgreSQL with connection pooling via `pg` library
- **Connection**: Environment variable-based database URL configuration
- **Schema**: Likely includes users table (with name, username, email, password) and posts table (with title, content, user relationships)

### Authentication System
- **Strategy**: Session-based authentication with server-side session storage
- **Password Security**: bcrypt hashing for password storage
- **Session Configuration**: 24-hour session expiry with HTTP-only cookies
- **Authorization**: Middleware-based route protection for authenticated endpoints

## External Dependencies

### Core Framework Dependencies
- **express**: Web application framework
- **pg**: PostgreSQL client for database operations
- **bcrypt**: Password hashing library
- **express-session**: Session management middleware

### Security & Middleware
- **cors**: Cross-origin resource sharing configuration
- **body-parser**: Request body parsing middleware
- **dotenv**: Environment variable management

### Authentication Libraries
- **passport**: Authentication middleware (installed but not actively used in current implementation)
- **passport-google-oauth20**: Google OAuth strategy (available for future OAuth integration)

### Database
- **PostgreSQL**: Primary database system for user accounts and blog post storage
- **Connection Pooling**: Configured via environment variable DATABASE_URL

### Environment Configuration
- **dotenv**: Manages database connections and session secrets via environment variables
- **Required Variables**: DATABASE_URL for PostgreSQL connection