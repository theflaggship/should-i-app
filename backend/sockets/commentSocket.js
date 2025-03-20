// sockets/commentSocket.js
const { Comment, User } = require('../models');
const WebSocket = require('ws');

const setupCommentSocket = (wss) => {
  wss.on('connection', (ws, request) => {
    // If NOT "/comments", skip comment logic
    if (request.url !== '/comments') {
      return;
    }

    console.log('Client connected to Comment WebSocket');

    // Handle socket-level errors
    ws.on('error', (err) => {
      console.error('Comment WebSocket error on a client:', err);
      ws.close();
    });

    ws.on('message', async (rawMessage) => {
      try {
        const { userId, pollId, commentText } = JSON.parse(rawMessage);
        if (!userId || !pollId || !commentText) {
          console.error('Missing userId, pollId, or commentText');
          return;
        }

        // Create the comment
        const newComment = await Comment.create({ userId, pollId, commentText });

        // Include user details
        const commentWithUser = await Comment.findByPk(newComment.id, {
          include: [{ model: User, attributes: ['id', 'username', 'profilePicture', 'displayName'], }],
        });

        // Prepare broadcast data
        const updatedCommentData = JSON.stringify({
          pollId,
          comment: {
            id: commentWithUser.id,
            text: commentWithUser.commentText,
            createdAt: commentWithUser.createdAt,
            User: commentWithUser.User,
          },
        });

        // Broadcast
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            try {
              client.send(updatedCommentData);
            } catch (sendErr) {
              console.error('Error sending to a comment client:', sendErr);
              client.close();
            }
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
