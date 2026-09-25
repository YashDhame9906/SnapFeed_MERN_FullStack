# SnapFeed Backend API

Node.js + Express REST API with MongoDB Atlas and ImageKit media integration.

## Folder Structure

```text
Backend/
│
├── src/
│   ├── config/
│   │   ├── db.js             # MongoDB connection configuration
│   │   └── imagekit.js       # ImageKit SDK client configuration
│   ├── controllers/          # Request handlers for auth, user, post, comment, follow
│   ├── middleware/           # Auth, upload, and error middlewares
│   ├── models/               # Mongoose schemas (User, Post, Comment)
│   ├── routes/               # Express route declarations
│   ├── utils/                # Helper utilities (tokens, standardized responses)
│   ├── app.js                # Express app setup and middleware configuration
│   └── server.js             # HTTP server entry point and DB connection
├── uploads/                  # Temporary file upload staging
├── .env.example              # Environment variables template
├── package.json
└── README.md
```

## Running the Backend

```bash
npm install
npm run dev
```
