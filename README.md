# 🚚 Smart Meter Truck Tracking System

A web-based platform for **tracking trucks transporting smart electricity meters**, managing meter inventory, and confirming deliveries.

The system provides **real-time truck location tracking, truck and meter management, and delivery verification** through a modern full-stack architecture.

---

# ✨ Key Features

## Role-Based Dashboards

The application supports two operational roles:

- **Sender** – manages trucks and smart meters
- **Receiver** – confirms incoming deliveries

---

# 📊 Sender Dashboard

The sender dashboard provides operational visibility and management tools.

### Capabilities

- View system statistics
  - Total trucks
  - Total meters
  - Active meters
  - Inactive meters
- Track truck locations on an interactive map
- Monitor truck readiness status
- Register new trucks
- Manage meters assigned to trucks

---

# 🚛 Truck Management

Each truck has a dedicated management page.

### Available Actions

- View meters assigned to the truck
- Add new meters
- Remove meters
- Move meters between trucks
- Toggle meter active/inactive status

### Truck Status

Truck status is calculated automatically.

| Status | Description |
|------|-------------|
| READY | All meters active |
| WARNING | One or more meters inactive |

---

# 📥 Receiver Dashboard

The receiver dashboard manages truck arrivals and delivery confirmation.

### Features

- View incoming trucks
- Upload delivery confirmation photo
- Confirm delivery
- Store delivery records

---

# 🗺️ Truck Tracking

Truck locations are displayed on a live interactive map.

### Mapping Technology

- **Leaflet.js**
- **React Leaflet**
- **OpenStreetMap**

Locations are refreshed periodically to provide updated truck positions.

---

# 🧰 Technology Stack

## Monorepo
- pnpm workspaces

## Backend
- Node.js 24
- Express 5
- PostgreSQL
- Drizzle ORM

## Frontend
- React
- Vite
- React Query
- Tailwind CSS
- Shadcn UI

## API & Validation
- OpenAPI 3.1
- Orval API code generation
- Zod validation

## Mapping
- Leaflet.js
- React Leaflet

---

# 📦 Project Structure

```
artifacts-monorepo/
│
├── artifacts/
│   ├── api-server/        # Express API server
│   └── meter-tracker/     # React + Vite frontend
│
├── lib/
│   ├── api-spec/          # OpenAPI specification
│   ├── api-client-react/  # Generated React Query hooks
│   ├── api-zod/           # Generated Zod schemas
│   └── db/                # Drizzle ORM database schema
│
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

---

# 🗄️ Database Schema

### Trucks

| Field | Description |
|------|-------------|
| id | Unique truck identifier |
| numberPlate | Truck number plate |
| createdAt | Creation timestamp |

### Meters

| Field | Description |
|------|-------------|
| id | Unique meter identifier |
| meterNumber | Meter serial number |
| status | Active / Inactive |
| truckId | Assigned truck |

### Deliveries

| Field | Description |
|------|-------------|
| id | Delivery identifier |
| truckId | Delivered truck |
| photoUrl | Delivery photo |
| deliveredAt | Delivery timestamp |

---

# 🔌 API Endpoints

## Trucks

```
GET    /api/trucks
POST   /api/trucks
GET    /api/trucks/:id
DELETE /api/trucks/:id
```

---

## Truck Locations

```
GET /api/trucks/locations/all
```

Returns the current location of all trucks.

---

## Meters

```
GET    /api/meters
POST   /api/meters
PUT    /api/meters/:id
DELETE /api/meters/:id
```

---

## Deliveries

```
GET  /api/deliveries
POST /api/deliveries
```

---

## System Stats

```
GET /api/stats
```

Returns dashboard statistics.

---

# ⚙️ Development Setup

## Install Dependencies

```
pnpm install
```

---

## Run Type Checking

```
pnpm run typecheck
```

---

## Start Backend Server

```
pnpm --filter @workspace/api-server dev
```

---

## Start Frontend

```
pnpm --filter @workspace/meter-tracker dev
```

---

# 🔧 API Code Generation

The OpenAPI specification is located at:

```
lib/api-spec/openapi.yaml
```

Generate API clients and schemas:

```
pnpm --filter @workspace/api-spec run codegen
```

---

# 🧩 TypeScript Architecture

The repository uses **TypeScript composite projects** with project references.

Benefits:

- Faster incremental builds
- Correct dependency resolution
- Strong type safety across packages

Run type checking from the workspace root:

```
pnpm run typecheck
```

---

# 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

---


