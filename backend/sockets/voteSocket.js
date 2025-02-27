// sockets/voteSocket.js
const { Poll, PollOption, Vote } = require('../models');
const WebSocket = require('ws');

const setupVoteSocket = (wss) => {
  wss.on('connection', (ws, request) => {
    // If this is "/comments", skip vote logic
    if (request.url === '/comments') {
      return;
    }

    console.log('Client connected to Vote WebSocket');

    // Handle socket errors so they don't crash the server
    ws.on('error', (err) => {
      console.error('Vote WebSocket error on a client:', err);
      ws.close(); // gracefully close
    });

    ws.on('message', async (rawMessage) => {
      try {
        const { userId, pollId, pollOptionId } = JSON.parse(rawMessage);
        if (!userId || !pollId || !pollOptionId) {
          console.error('Missing userId, pollId, or pollOptionId');
          return;
        }

        // 1) Check if user already voted in this poll
        let existingVote = await Vote.findOne({ where: { userId, pollId } });
        if (existingVote) {
          // Already voted
          if (existingVote.pollOptionId === pollOptionId) {
            // Unvote
            await existingVote.destroy();

            const sameOption = await PollOption.findByPk(pollOptionId);
            if (sameOption) {
              sameOption.votes = Math.max(sameOption.votes - 1, 0);
              await sameOption.save();
            }
          } else {
            // Switch vote
            const oldOption = await PollOption.findByPk(existingVote.pollOptionId);
            if (oldOption) {
              oldOption.votes = Math.max(oldOption.votes - 1, 0);
              await oldOption.save();
            }
            existingVote.pollOptionId = pollOptionId;
            await existingVote.save();

            const newOption = await PollOption.findByPk(pollOptionId);
            if (newOption) {
              newOption.votes += 1;
              await newOption.save();
            }
          }
        } else {
          // No existing vote => create
          await Vote.create({ userId, pollId, pollOptionId });

          const option = await PollOption.findByPk(pollOptionId);
          if (option) {
            option.votes += 1;
            await option.save();
          }
        }

        // 2) Broadcast updated poll data
        const poll = await Poll.findByPk(pollId, {
          include: [
            {
              model: PollOption,
              as: 'options',
              attributes: ['id', 'optionText', 'votes', 'sortOrder'],
              order: [['sortOrder', 'ASC']],
            },
          ],
        });

        // Figure out the user's current vote (if any)
        let userVote = null;
        const finalVote = await Vote.findOne({ where: { userId, pollId } });
        if (finalVote) {
          userVote = finalVote.pollOptionId;
        }

        const updatedPollData = JSON.stringify({
          pollId: poll.id,
          userVote, // <-- Now we include the user's voted option
          options: poll.options.map((opt) => ({
            id: opt.id,
            text: opt.optionText,
            votes: opt.votes,
          })),
        });

        // Broadcast to all connected clients
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            try {
              client.send(updatedPollData);
            } catch (sendErr) {
              console.error('Error sending to a vote client:', sendErr);
              client.close();
            }
          }
        });
      } catch (err) {
        console.error('Vote WebSocket Error:', err);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from Vote WebSocket');
    });
  });
};

module.exports = setupVoteSocket;
