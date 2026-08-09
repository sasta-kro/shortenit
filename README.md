# ShortenIt

A modern, full-featured URL shortening and analytics platform built with Spring Boot and Next.js. Fast redirects, custom short links, QR code generation, and comprehensive click analytics.

## Features

### Core Functionality
- **URL Shortening** - Auto-generated or custom short codes
- **Fast Redirects** - Optimized redirection via `/s/{code}`
- **QR Code Generation** - Instant QR codes for shortened links
- **Link Management** - Full CRUD operations for your links
- **Link Expiration** - Optional expiration dates for time-limited links

### Analytics & Tracking
- **Click Tracking** - Comprehensive click count monitoring
- **Geographic Analytics** - Country and city tracking via GeoIP
- **Device Detection** - Mobile, tablet, and desktop identification
- **Browser & OS Stats** - Detailed user agent analysis
- **Referrer Tracking** - Track traffic sources
- **Time-Series Data** - Visual charts and trends

### Authentication & Security
- **Microsoft OAuth2** - Single sign-on with Azure AD
- **JWT Authentication** - Secure access and refresh tokens
- **Role-Based Access** - USER and ADMIN roles
- **API Keys** - Programmatic access for CLI and integrations
- **Domain Restriction** - Email domain whitelisting (@au.edu)

### Admin Features
- **User Management** - List, view, promote, demote, and delete users
- **System Analytics** - System-wide URL and click statistics
- **Protected Admin** - Configurable super-admin protection
- **Audit Controls** - Comprehensive user and URL oversight

## Tech Stack

### Backend
- **Framework:** Spring Boot 4.0.0
- **Language:** Java 17
- **Database:** PostgreSQL 15
- **Authentication:** OAuth2 + JWT
- **Analytics:** MaxMind GeoIP2
- **Build Tool:** Maven

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **UI Library:** React 19
- **Styling:** Tailwind CSS v4
- **Components:** Radix UI
- **Charts:** Recharts

### Infrastructure
- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Reverse Proxy:** Nginx
- **Platforms:** Multi-arch (amd64/arm64)

## Quick Start

### Prerequisites
- Docker and Docker Compose
- (Optional) Java 17 and Maven for local development
- (Optional) Node.js 18+ and pnpm for frontend development

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/shortenit/shortenit
   cd shortenit
   ```

2. **Create environment file**
   ```bash
   make  # Creates .env from template
   ```

3. **Configure environment variables**

   Edit `.env` with your configuration:
   ```bash
   # Database
   DB_NAME=shortenit_db
   DB_USER=shortenit
   DB_PASSWORD=your_secure_password

   # Application
   SPRING_PROFILES_ACTIVE=dev
   APP_BASE_URL=http://localhost:3000
   APP_BASE_PATH=
   JWT_SECRET=your_jwt_secret_min_32_chars

   # Microsoft OAuth2
   MICROSOFT_CLIENT_ID=your_azure_app_id
   MICROSOFT_CLIENT_SECRET=your_azure_app_secret

   # Security
   CORS_ALLOWED_ORIGINS=http://localhost:3000
   PROTECTED_ADMIN_EMAIL=admin@au.edu
   ```

   `JWT_SECRET` is required for authentication when running with Docker Compose
   and must contain at least 32 characters. Generate a suitable value with:

   ```bash
   openssl rand -base64 32
   ```

   After changing `.env`, recreate the containers with `make dev-down` followed
   by `make dev-up` so the backend receives the new value.

4. **Download GeoIP database**
   ```bash
   make geoip-prepare
   ```

5. **Start development environment**
   ```bash
   make dev-up
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - Database: localhost:5432

### Production Deployment

1. **Using pre-built images**
   ```bash
   make prod-up
   ```

2. **Configure Nginx** (recommended)
   ```bash
   cp shortenit.conf.example /etc/nginx/sites-available/shortenit
   # Edit the file with your domain and SSL certificates
   sudo ln -s /etc/nginx/sites-available/shortenit /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### Deploying Under a Path

ShortenIt can run at the root of a domain or under a path such as
`https://life.au.edu/shortenit`. Configure the public URL and path together:

```bash
APP_BASE_PATH=/shortenit
APP_BASE_URL=https://life.au.edu${APP_BASE_PATH}
CORS_ALLOWED_ORIGINS=https://life.au.edu
```

`APP_BASE_PATH` must be empty or start with `/`, and it must not end with `/`.
The path in `APP_BASE_URL` must match it exactly. `CORS_ALLOWED_ORIGINS` contains
only the origin and never includes `/shortenit`.

The frontend base path is embedded during `next build`, so changing
`APP_BASE_PATH` requires rebuilding the frontend image. The backend reads the
same value at runtime. For a path deployment, use a frontend image built with
that path and select the production images in `.env` when needed:

```bash
FRONTEND_IMAGE=your-dockerhub-name/shortenit-frontend:latest
BACKEND_IMAGE=your-dockerhub-name/shortenit-backend:latest
```

The Docker publishing workflow reads `APP_BASE_PATH` and
`DOCKERHUB_NAMESPACE` from GitHub repository variables. Optional
`FRONTEND_IMAGE` and `BACKEND_IMAGE` repository variables select the complete
image names; they default to `shortenit/frontend` and `shortenit/backend`. The
workflow uses the existing `DOCKERHUB_TOKEN` secret. A manual workflow run can
override the frontend path.

When using `/shortenit`, register this Microsoft Entra redirect URI:

```text
https://life.au.edu/shortenit/login/oauth2/code/microsoft
```

Add the locations from `shortenit-path.conf.example` to the existing HTTPS
Nginx server block. Its backend `proxy_pass` directives preserve `/shortenit`
because Spring Boot owns the context path.

## Available Commands

```bash
make help              # Show all available commands
make dev-up            # Start development environment
make dev-down          # Stop development environment
make dev-down-cleanup  # Stop and remove volumes
make prod-up           # Start production environment
make prod-down         # Stop production environment
make geoip-prepare     # Download GeoIP database
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Initialize OAuth2 login
- `GET /api/auth/oauth2/success` - OAuth2 callback handler
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Invalidate tokens
- `GET /api/auth/me` - Get current user info

### URL Management
- `GET /api/urls` - List user's URLs
- `POST /api/urls` - Create short URL
- `GET /api/urls/{code}` - Get URL details
- `PUT /api/urls/{code}` - Update URL
- `DELETE /api/urls/{code}` - Delete URL

### Analytics
- `GET /api/analytics` - Get all analytics (paginated)
- `GET /api/analytics/{shortCode}` - Get analytics for specific URL
- `GET /api/analytics/{shortCode}/range` - Get analytics by date range

### Admin
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/{id}` - Get user details
- `DELETE /api/admin/users/{id}` - Delete user
- `POST /api/admin/users/{id}/promote` - Promote user to admin
- `POST /api/admin/users/{id}/demote` - Demote admin to user
- `GET /api/admin/urls` - List all URLs
- `GET /api/admin/urls/analytics` - System-wide analytics

### Redirection
- `GET /s/{code}` - Redirect to original URL (tracks analytics)

## CLI Tool

Want to shorten URLs from your terminal? Check out the official CLI tool:

**[ShortenIt CLI](https://github.com/shortenit/shortenit-cli)**

Features:
- Shorten URLs from the command line
- Custom short codes
- QR code generation
- Analytics viewing
- API key authentication

## Project Structure

```
shortenit/
├── backend/                 # Spring Boot application
│   ├── src/
│   │   └── main/java/edu/au/life/shortenit/
│   │       ├── config/      # Security, CORS, JPA config
│   │       ├── controller/  # REST API endpoints
│   │       ├── dto/         # Data Transfer Objects
│   │       ├── entity/      # JPA entities
│   │       ├── repository/  # Spring Data repositories
│   │       ├── security/    # JWT filters, OAuth handlers
│   │       ├── service/     # Business logic
│   │       └── util/        # Helper utilities
│   ├── Dockerfile
│   └── pom.xml
├── frontend/                # Next.js application
│   ├── app/                 # App Router pages
│   │   ├── admin/           # Admin dashboard
│   │   ├── analytics/       # Analytics views
│   │   ├── links/           # Link management
│   │   └── qrcodes/         # QR code generator
│   ├── components/          # React components
│   ├── lib/                 # API client and utilities
│   ├── Dockerfile
│   └── package.json
├── .github/workflows/       # CI/CD pipelines
├── docker-compose.yml       # Base compose config
├── docker-compose.dev.yml   # Development overrides
├── docker-compose.prod.yml  # Production overrides
├── Makefile                 # Convenience commands
├── .env.template               # Environment template
├── shortenit.conf.example      # Full-domain Nginx configuration
└── shortenit-path.conf.example # Path-based Nginx locations
```

## Database Schema

The application uses PostgreSQL with the following main entities:

- **users** - User accounts with OAuth2 integration
- **urls** - Shortened URLs with metadata
- **url_clicks** - Click tracking and analytics data
- **api_keys** - API keys for programmatic access
- **refresh_tokens** - JWT refresh token storage

See `backend/erd_shorenit.png` for the full entity relationship diagram.

## Configuration

### Backend Configuration

Key application properties (configured via environment variables):

- `APP_BASE_URL` - Base URL for short links
- `APP_BASE_PATH` - Optional shared URL prefix, such as `/shortenit`
- `JWT_SECRET` - Required secret key for JWT signing in Docker Compose (min 32 chars)
- `MICROSOFT_CLIENT_ID` - Azure AD application ID
- `MICROSOFT_CLIENT_SECRET` - Azure AD application secret
- `CORS_ALLOWED_ORIGINS` - Comma-separated allowed origins
- `PROTECTED_ADMIN_EMAIL` - Email of protected admin user

### Frontend Configuration

- `NEXT_PUBLIC_API_BASE_URL` - Backend API base URL

`APP_BASE_PATH` is also used when building the frontend. It is exposed to
browser code as `NEXT_PUBLIC_BASE_PATH`; users should configure
`APP_BASE_PATH`, not the generated browser variable.

### GeoIP Database

The application uses MaxMind GeoLite2 for IP geolocation. The database is automatically downloaded during build from [P3TERX/GeoLite.mmdb](https://github.com/P3TERX/GeoLite.mmdb/releases).

## Development

### Backend Development

```bash
cd backend
./mvnw spring-boot:run
```

### Frontend Development

```bash
cd frontend
pnpm install
pnpm dev
```

### Building for Production

```bash
# Backend
cd backend
./mvnw clean package

# Frontend
cd frontend
pnpm build
```

## Docker Images

Pre-built Docker images are available on Docker Hub:

- `shortenit/backend:latest`
- `shortenit/frontend:latest`

Images are automatically built and pushed via GitHub Actions on every push to main.

## Security Considerations

- **HTTPS Only** - Configure SSL/TLS in production (see `shortenit.conf.example`)
- **JWT Secrets** - Use strong, random secrets (min 32 characters)
- **Database Passwords** - Use strong, unique passwords
- **CORS Configuration** - Restrict to your domain only
- **Email Domain Restriction** - Configure allowed email domains
- **Security Headers** - Enabled via Nginx configuration (CSP, HSTS, etc.)

## Monitoring & Health Checks

- **Health Endpoint:** `${APP_BASE_PATH}/actuator/health`
- **Docker Health Checks:** Automatic container health monitoring
- **Database Health:** Connection pool monitoring via Actuator

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is developed as a Senior Project at Assumption University.

## Support

For issues and questions:
- Open an issue on GitHub

## Acknowledgments

- Built as a Senior Project at Assumption University
- Powered by Spring Boot and Next.js
- Analytics by MaxMind GeoIP2
- UI components by Radix UI
- Icons by Lucide

---
