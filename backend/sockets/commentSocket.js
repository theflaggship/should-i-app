// commentSocket.js
const { Comment, User } = require('../models');

const setupCommentSocket = (wss) => {
  wss.on('connection', (ws) => {
    console.log('Client connected to Comment WebSocket');

    ws.on('message', async (rawMessage) => {
      try {
        // Parse the incoming data
        const { userId, pollId, text } = JSON.parse(rawMessage);

        if (!userId || !pollId || !text) {
          console.error('Missing userId, pollId, or text');
          return;
        }

        // Create the comment in the database
        const newComment = await Comment.create({ userId, pollId, text });

        // Optionally include user details for the new comment
        const commentWithUser = await Comment.findByPk(newComment.id, {
          include: [{ model: User, attributes: ['id', 'username', 'profilePicture'] }],
        });

        // Broadcast the new comment to all connected clients
        const message = JSON.stringify({ 
            pollId, 
            comment: {
            id: commentWithUser.id,
            text: commentWithUser.commentText,
            createdAt: commentWithUser.createdAt,
            User: commentWithUser.User // includes username, profilePicture
          } 
        });
        wss.clients.forEach((client) => {
          if (client.readyState === ws.OPEN) {
            client.send(message);
          }
        });
      } catch (error) {
        console.error('Comment WebSocket Error:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from Comment WebSocket');
    });
  });
};

module.exports = setupCommentSocket;
