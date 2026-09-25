# SnapFeed — Full-Stack MERN Social Media Application

SnapFeed is a clean, practical, image-sharing social media web application built with the MERN stack (MongoDB, Express.js, React, Node.js). It provides a familiar, distraction-free social experience with an emphasis on authentic community sharing, responsive performance, and clean architecture.

---

## Architecture Overview

SnapFeed is divided into two primary directories:

```text
SnapFeed/
│
├── Backend/        # Node.js + Express REST API with MongoDB & ImageKit
├── Frontend/       # React (Vite) client with vanilla CSS styling
├── README.md       # Root project documentation & setup guide
└── .gitignore      # Root Git ignore rules
```

### Communication Flow

The Frontend client and Backend API communicate over HTTP/REST using Axios:

```text
React (Vite)
  ↓
Axios Client (services/api.js)
  ↓ [Bearer JWT Authorization]
Express API (Routes -> Middleware -> Controllers)
  ↓
Mongoose ODM
  ↓
MongoDB Atlas Database
```

#### Image Upload Flow

```text
React File Input
  ↓
Axios multipart/form-data
  ↓
Express Router
  ↓
Multer (Memory/Buffer processing)
  ↓
ImageKit SDK Upload
  ↓
Returns imageUrl & imageFileId
  ↓
Mongoose Post/User Model saved in MongoDB Atlas
```

#### Authentication Flow

```text
React Login/Register Form
  ↓
POST /api/auth/login or /api/auth/register
  ↓
Express Controller (bcrypt verification / hashing)
  ↓
JWT Signed with JWT_SECRET
  ↓
Token stored in localStorage + Axios Auth header
  ↓
Protected API requests authenticated via auth.middleware.js
```

---

## Features

- **Authentication & Authorization**: Secure signup, login, session persistence via JWT, and server-side resource ownership validation.
- **Image Posts**: Upload images via ImageKit CDN with captions, automatic thumbnail handling, and storage tracking.
- **Feed System**:
  - **Personalized Feed**: Chronological feed containing posts from the logged-in user and accounts they follow.
  - **Explore Feed**: Public feed highlighting recent posts from across the platform.
- **Engagement**:
  - Like and unlike posts with real-time counters.
  - Comment on posts and manage user's own comments.
- **Profiles & Follow System**:
  - Custom profiles with avatar uploads, bio editing, post counts, followers, and following tallies.
  - Follow/unfollow users with bidirectional graph relationship updates.
  - User search by username.
- **Responsive & Minimal Design**: Clean typography, handcrafted styling without heavy UI frameworks, and mobile-friendly layouts (320px to 1440px+).

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React, Vite, React Router, Axios, Pure CSS3 |
| **Backend** | Node.js, Express.js, Multer, ImageKit SDK, CORS, Dotenv |
| **Database** | MongoDB Atlas with Mongoose ODM |
| **Authentication** | JSON Web Tokens (JWT), bcryptjs |

---

## Prerequisites

Ensure you have the following installed and set up before running SnapFeed locally:

1. **Node.js** (v18.x or newer recommended)
2. **npm** (v9.x or newer)
3. **MongoDB Atlas Account** (free cluster tier is sufficient)
4. **ImageKit Account** (free tier is sufficient for image storage & CDN delivery)
5. **Git**

---

## Setup & Configuration

### 1. MongoDB Atlas Setup

1. Sign up or log into [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new cluster (Shared / Free tier M0).
3. Under **Security > Database Access**, add a new database user with Read and Write privileges.
4. Under **Security > Network Access**, click **Add IP Address** and add `0.0.0.0/0` (allow access from anywhere) or specify your current IP address.
5. In **Database Deployments**, click **Connect** > **Drivers** > **Node.js**.
6. Copy the connection string. It resembles:
   ```text
   mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/snapfeed?retryWrites=true&w=majority
   ```
7. Replace `<username>` and `<password>` with your database user credentials. Target the `snapfeed` database.

### 2. ImageKit Setup

1. Sign up or log into [ImageKit.io](https://imagekit.io/).
2. Navigate to the **Developer Options** tab in your ImageKit dashboard.
3. Locate:
   - **Public Key**
   - **Private Key**
   - **URL-endpoint**
4. Add these credentials to `Backend/.env`.
> [!CAUTION]
> Never expose your ImageKit Private Key in frontend code or commit it to version control.

### 3. Backend Environment (`Backend/.env`)

Copy `Backend/.env.example` to `Backend/.env`:

```bash
cd Backend
cp .env.example .env
```

Populate the variables:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_jwt_secret_key_here
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
CLIENT_URL=http://localhost:5173
```

### 4. Frontend Environment (`Frontend/.env`)

Copy `Frontend/.env.example` to `Frontend/.env`:

```bash
cd Frontend
cp .env.example .env
```

Populate the variable:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Environment Setup Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with read/write access
- [ ] Network access allowed (IP whitelist configured)
- [ ] `MONGO_URI` added to `Backend/.env`
- [ ] ImageKit account created
- [ ] ImageKit public key, private key, and URL endpoint added to `Backend/.env`
- [ ] `JWT_SECRET` generated and configured
- [ ] `CLIENT_URL` configured in `Backend/.env`
- [ ] `Frontend/.env` created with `VITE_API_URL`
- [ ] Backend running (`npm run dev` in `Backend/`)
- [ ] Frontend running (`npm run dev` in `Frontend/`)

---

## Installation & Running Locally

### Start Backend

```bash
cd Backend
npm install
npm run dev
```

The backend server runs on `http://localhost:5000`.

### Start Frontend

```bash
cd Frontend
npm install
npm run dev
```

The frontend client runs on `http://localhost:5173`.

---

## API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Register a new user (`username`, `email`, `password`) |
| `POST` | `/api/auth/login` | No | Login existing user (`email`, `password`) |
| `POST` | `/api/auth/logout` | Yes | Logout current user session |
| `GET` | `/api/auth/me` | Yes | Get authenticated user profile & data |

### Posts (`/api/posts`)
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/posts` | Yes | Get personalized feed (user + followed users, paginated) |
| `GET` | `/api/posts/explore` | Yes/Optional | Get public explore feed (recent posts, paginated) |
| `GET` | `/api/posts/:id` | Yes/Optional | Get single post details and comments |
| `POST` | `/api/posts` | Yes | Create post with image upload & caption |
| `PUT` | `/api/posts/:id` | Yes | Edit caption of an existing post (owner only) |
| `DELETE` | `/api/posts/:id` | Yes | Delete post and remove image from ImageKit (owner only) |
| `POST` | `/api/posts/:id/like` | Yes | Like a post |
| `POST` | `/api/posts/:id/unlike` | Yes | Unlike a post |
| `GET` | `/api/posts/:id/comments` | Yes/Optional | List comments for a post |
| `POST` | `/api/posts/:id/comments` | Yes | Add comment to a post |

### Comments (`/api/comments`)
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `DELETE` | `/api/comments/:id` | Yes | Delete comment (comment author only) |

### Users (`/api/users`)
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/users/:username` | Yes/Optional | Get user public profile and their posts |
| `PUT` | `/api/users/profile` | Yes | Update profile (`bio`, `profileImage`) |
| `GET` | `/api/users/:username/followers` | Yes/Optional | List followers of a user |
| `GET` | `/api/users/:username/following` | Yes/Optional | List following of a user |
| `GET` | `/api/users/search?q=` | Yes/Optional | Search users by username query |
| `POST` | `/api/users/:id/follow` | Yes | Follow a target user |
| `POST` | `/api/users/:id/unfollow` | Yes | Unfollow a target user |

---

## Deployment Notes

SnapFeed is architected to allow independent deployment:
- **Backend**: Can be deployed to services such as Render, Railway, Heroku, or AWS EC2 with environment variables configured in their respective secret management panels.
- **Frontend**: Can be built via `npm run build` and hosted on Vercel, Netlify, or Firebase Hosting pointing to the live backend URL via `VITE_API_URL`.
