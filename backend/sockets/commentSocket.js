// sockets/commentSocket.js
const { Comment, User } = require('../models');
const WebSocket = require('ws');

const setupCommentSocket = (wss) => {
  wss.on('connection', (ws, request) => {
    if (request.url !== '/comments') return;

    console.log('Client connected to Comment WebSocket');

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

        // 1. Create the new comment
        const comment = await Comment.create({ userId, pollId, commentText, edited: false });


        // 2. Re-fetch with full user details using correct alias
        const commentWithUser = await Comment.findByPk(comment.id, {
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'displayName', 'profilePicture'],
            },
          ],
        });

        // 3. Format it exactly how the frontend expects
        const formattedComment = {
          id: commentWithUser.id,
          text: commentWithUser.commentText,
          createdAt: commentWithUser.createdAt,
          user: commentWithUser.user,
          edited: commentWithUser.edited || false,
        };

        // 4. Broadcast to all connected clients
        const messageToSend = JSON.stringify({
          pollId,
          comment: formattedComment,
        });

        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            try {
              client.send(messageToSend);
            } catch (sendErr) {
              console.error('Error sending to comment client:', sendErr);
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
