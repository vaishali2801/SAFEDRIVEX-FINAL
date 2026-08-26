# SafeDriveX Backend API

AI-Powered Road Safety & Reward System - Backend for Future 6.0 Hackathon

## Project Overview

SafeDriveX is an AI + IoT based road safety platform that detects unsafe driving behavior, provides real-time alerts, tracks driving performance, calculates safety scores, rewards safe behavior with points, and provides emergency SOS functionality.

## Architecture

```
server/
├── config/          # Configuration files (DB, Env, Socket)
├── controllers/     # Request handlers
├── middleware/      # Auth, validation, error handling, rate limiting
├── models/          # Mongoose models
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Helpers, constants, calculations
├── seed/            # Database seeding
├── sockets/         # Socket.IO event handlers
├── app.js           # Express app setup
└── server.js        # Entry point
```

## Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT + bcryptjs
- **Real-time**: Socket.IO
- **Validation**: express-validator
- **Security**: helmet, cors, express-rate-limit, hpp, mongo-sanitize
- **Logging**: Morgan

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- MongoDB >= 5.0

### Installation

```bash
cd server
npm install
```

### Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

### Database Seeding

```bash
npm run seed
```

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### User Profile
- `GET /api/users/profile` - Get profile
- `PATCH /api/users/profile` - Update profile
- `PATCH /api/users/password` - Change password
- `GET /api/users/stats` - Get user stats
- `GET /api/users/vehicles` - Get user vehicles
- `POST /api/users/vehicles` - Add vehicle
- `PATCH /api/users/vehicles/primary` - Set primary vehicle

### Driving Sessions
- `POST /api/driving/start` - Start driving session
- `GET /api/driving/active` - Get active session
- `POST /api/driving/end` - End driving session
- `GET /api/driving/history` - Get driving history
- `GET /api/driving/stats` - Get driving stats
- `GET /api/driving/:id` - Get session by ID
- `PATCH /api/driving/:id` - Update session data
- `GET /api/driving/sensors/status` - Get sensor status

### Safety Score
- `GET /api/safety/score` - Get safety score
- `GET /api/safety/history` - Get score history
- `GET /api/safety/breakdown` - Get score breakdown

### Alerts
- `GET /api/alerts` - Get alerts
- `GET /api/alerts/unread-count` - Get unread count
- `PATCH /api/alerts/:id/read` - Mark as read
- `PATCH /api/alerts/read-all` - Mark all as read
- `DELETE /api/alerts/:id` - Delete alert

### Rewards
- `GET /api/rewards` - Get all rewards
- `GET /api/rewards/:id` - Get reward by ID
- `POST /api/rewards/:id/redeem` - Redeem reward
- `GET /api/rewards/my-redemptions` - Get user redemptions

### Leaderboard
- `GET /api/leaderboard` - Get leaderboard (query: period=weekly|monthly|all-time)

### Emergency
- `POST /api/emergency/sos` - Trigger SOS
- `GET /api/emergency/history` - Get emergency history
- `GET /api/emergency/:id` - Get emergency by ID

### Sensors (IoT)
- `POST /api/sensors/data` - Receive sensor data
- `GET /api/sensors` - Get all sensors
- `GET /api/sensors/device/:deviceId` - Get device sensors
- `GET /api/sensors/device/:deviceId/status` - Get device status
- `POST /api/sensors/device/register` - Register device
- `GET /api/sensors/devices` - Get user devices
- `PATCH /api/sensors/device/:deviceId/sensor/:sensorType` - Update sensor status

### AI Detection
- `POST /api/ai/helmet` - Helmet detection
- `POST /api/ai/phone` - Phone detection
- `POST /api/ai/seatbelt` - Seatbelt detection
- `POST /api/ai/drowsiness` - Drowsiness detection
- `POST /api/ai/lane` - Lane detection
- `POST /api/ai/driving-behaviour` - Driving behaviour analysis
- `GET /api/ai/endpoints` - Get AI endpoints info

### Dashboard
- `GET /api/dashboard` - Get complete dashboard data

### Admin (Admin Only)
- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/analytics` - Admin analytics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get user by ID
- `PATCH /api/admin/users/:id/status` - Update user status
- `GET /api/admin/violations` - Get all violations
- `GET /api/admin/sensors` - Get all sensors
- `GET /api/admin/rewards` - Get all rewards
- `POST /api/admin/rewards` - Create reward
- `PATCH /api/admin/rewards/:id` - Update reward
- `DELETE /api/admin/rewards/:id` - Delete reward

### Simulation & Demo
- `POST /api/simulation/start` - Start simulation
- `POST /api/simulation/stop` - Stop simulation
- `POST /api/simulation/safe` - Simulate safe driving
- `POST /api/simulation/warning` - Simulate warning
- `POST /api/simulation/violation` - Simulate violation
- `POST /api/simulation/emergency` - Simulate emergency
- `POST /api/simulation/demo/start` - Start demo
- `POST /api/simulation/demo/next` - Next demo stage
- `POST /api/simulation/demo/reset` - Reset demo

## Socket.IO Events

### Client to Server
- `driver:join` - Join driving session
- `driver:leave` - Leave driving session

### Server to Client
- `sensor:update` - Sensor data update
- `speed:update` - Speed update
- `safety:update` - Safety status update
- `alert:new` - New alert
- `violation:new` - New violation
- `score:update` - Safety score update
- `points:update` - Points update
- `driving:start` - Driving session started
- `driving:end` - Driving session ended
- `emergency:trigger` - Emergency triggered

## Demo Credentials

### Driver
- Email: `demo@safedrivex.com`
- Password: `Demo@123`

### Admin
- Email: `admin@safedrivex.com`
- Password: `Admin@123`

## Demo Mode

The demo mode runs through 5 stages for hackathon judges:

1. **Stage 1**: Safe driving (Helmet: SAFE, Phone: SAFE, Speed: 45, Score: 85)
2. **Stage 2**: Safe behavior (+15 points, Score: 88)
3. **Stage 3**: Phone detected (-100 points, Score reduced, Alerts emitted)
4. **Stage 4**: Driver becomes safe (Phone: SAFE)
5. **Stage 5**: Journey completed (+50 points, Final score)

Run with:
```bash
POST /api/simulation/demo/start
POST /api/simulation/demo/next  # Repeat for stages 2-5
POST /api/simulation/demo/reset
```

## AI Integration

The AI detection endpoints are ready for integration with external AI services (YOLO/OpenCV/TensorFlow). The backend processes AI results and updates scores, points, violations, and alerts accordingly.

## IoT Integration

The sensor endpoints accept data from ESP32/Arduino devices via HTTP or WebSocket. The system processes GPS, accelerometer, helmet, seatbelt, and other sensor data in real-time.

## Database Models

1. **User** - User profiles, points, safety scores
2. **Vehicle** - Vehicle information
3. **DrivingSession** - Driving journey records
4. **DrivingEvent** - Individual driving events
5. **SafetyScore** - Score change history
6. **Reward** - Available rewards
7. **RewardRedemption** - Redemption records
8. **Violation** - Traffic violations
9. **Alert** - System alerts
10. **Emergency** - SOS emergencies
11. **Sensor** - IoT sensor data
12. **Device** - IoT device registry

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on all endpoints
- Input validation and sanitization
- CORS configuration
- Helmet security headers
- HPP protection
- MongoDB injection prevention

## License

MIT# SAFEDRIVEX-FINAL
