# Newpot HBNY Backend

Backend API for Newpot HBNY e-commerce platform built with NestJS, Prisma, and PostgreSQL.    ( tung is stupid   and  need to learn  about how to vibe  code )
this is dang ba ty
## Tech Stack

- **Framework:** NestJS 10.x
- **ORM:** Prisma
- **Database:** PostgreSQL 16
- **Authentication:** JWT with HTTP-only cookies
- **Email:** Nodemailer (Gmail SMTP)
- **Documentation:** Swagger/OpenAPI
- **Containerization:** Docker & Docker Compose

## Features

- **Authentication**
  - User signup with admin approval workflow
  - Email verification
  - JWT-based authentication with cookies
  - Role-based access control (Admin/User)

- **Product Management**
  - Categories CRUD
  - Products with multiple images
  - Product-category relationships (many-to-many)

- **Shopping**
  - Shopping cart management
  - Order placement and tracking
  - Order status management (Admin)

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Gmail account for SMTP (or other email provider)

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/newpot_hbny?schema=public"

# JWT
JWT_SECRET="your-jwt-secret-key"
JWT_EXPIRES_IN="7d"

# App
PORT=8000
NODE_ENV=development

# Mail (Gmail SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
MAIL_FROM="Newpot HBNY <your-email@gmail.com>"
```

## Installation

### Using Docker (Recommended)

```bash
# Development (with hot reload)
docker-compose -f docker-compose.dev.yml up -d --build

# Production
docker-compose up -d --build
```

### Manual Setup

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start development server
npm run start:dev
```

## API Documentation

Once the server is running, access Swagger documentation at:

```
http://localhost:8000/api/docs
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/user/signup` | User registration |
| POST | `/auth/user/signin` | User login |
| POST | `/auth/user/signout` | User logout |
| GET | `/auth/user/verify-email` | Verify email |
| POST | `/auth/admin/signin` | Admin login |
| GET | `/auth/admin/pending-users` | Get pending users |
| POST | `/auth/admin/accept/:id` | Accept user |
| POST | `/auth/admin/reject/:id` | Reject user |

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/categories` | Get all categories |
| GET | `/categories/:id` | Get category by ID |
| POST | `/categories` | Create category (Admin) |
| PATCH | `/categories/:id` | Update category (Admin) |
| DELETE | `/categories/:id` | Delete category (Admin) |

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | Get all products |
| GET | `/products/:id` | Get product by ID |
| POST | `/products` | Create product (Admin) |
| PATCH | `/products/:id` | Update product (Admin) |
| DELETE | `/products/:id` | Delete product (Admin) |

### Cart

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/cart` | Get user's cart |
| POST | `/cart` | Add item to cart |
| PATCH | `/cart/:id` | Update cart item |
| DELETE | `/cart/:id` | Remove cart item |
| DELETE | `/cart` | Clear cart |

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orders` | Get user's orders |
| GET | `/orders/:id` | Get order by ID |
| POST | `/orders` | Place order |
| PATCH | `/orders/:id/status` | Update order status (Admin) |

## Project Structure

```
src/
├── config/           # Configuration files
├── guards/           # Authentication guards
├── modules/
│   ├── auth/         # Authentication modules
│   │   ├── admin/    # Admin auth
│   │   └── user/     # User auth
│   ├── cart/         # Cart management
│   ├── category/     # Category CRUD
│   ├── mail/         # Email service
│   ├── order/        # Order management
│   └── product/      # Product CRUD
├── prisma/           # Prisma service
└── types/            # TypeScript types
```

## Database Schema

```prisma
- User (id, email, password, name, role, status, ...)
- Category (id, name, description, image)
- Product (id, name, description, price, stock, ...)
- ProductCategory (productId, categoryId) - Join table
- Image (id, url, productId)
- CartItem (id, userId, productId, quantity)
- Order (id, userId, status, total, ...)
- OrderItem (id, orderId, productId, quantity, price)
```

## Scripts

```bash
npm run start:dev    # Development with hot reload
npm run start:prod   # Production mode
npm run build        # Build the application
npm run lint         # Run ESLint
npm run test         # Run unit tests
npm run test:e2e     # Run e2e tests
```

## License

MIT
