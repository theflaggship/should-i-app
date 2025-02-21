require('dotenv').config();
const express = require('express');
const http = require('http'); // Needed for WebSocket server
const { Server } = require('ws'); // WebSocket Server
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new Server({ server }); // Create WebSocket Server

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors());

// Import routes
const authRoutes = require('./routes/auth');
const pollRoutes = require('./routes/polls');
const userRoutes = require('./routes/users');
const voteRoutes = require('./routes/votes');
const commentRoutes = require('./routes/comments');
const followRoutes = require('./routes/follow');
const searchRoutes = require('./routes/search');
const categoryRoutes = require('./routes/categories');

// Import WebSocket handling
const setupVoteSocket = require('./sockets/voteSocket');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/users', userRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/categories', categoryRoutes);

// Error handling middleware
const errorHandler = require('./middlewares/errorHandler');
app.use(errorHandler);

// Setup WebSocket events
setupVoteSocket(wss);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
