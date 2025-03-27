// sockets/voteSocket.js
const { Poll, PollOption, Vote } = require('../models');
const WebSocket = require('ws');

const setupVoteSocket = (wss) => {
  wss.on('connection', (ws, request) => {
    if (request.url === '/comments') return;

    console.log('Client connected to Vote WebSocket');

    ws.on('error', (err) => {
      console.error('Vote WebSocket error on a client:', err);
      ws.close();
    });

    ws.on('message', async (rawMessage) => {
      try {
        const { userId, pollId, pollOptionId } = JSON.parse(rawMessage);
        if (!userId || !pollId || !pollOptionId) {
          console.error('Missing userId, pollId, or pollOptionId');
          return;
        }

        let existingVote = await Vote.findOne({ where: { userId, pollId } });

        if (existingVote) {
          if (existingVote.pollOptionId === pollOptionId) {
            // Unvote
            await existingVote.destroy();

            const option = await PollOption.findByPk(pollOptionId);
            if (option) {
              option.votes = Math.max(option.votes - 1, 0);
              await option.save();
            }
          } else {
            // Change vote
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
          // New vote
          await Vote.create({ userId, pollId, pollOptionId });

          const option = await PollOption.findByPk(pollOptionId);
          if (option) {
            option.votes += 1;
            await option.save();
          }
        }

        // Fetch updated poll
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

        let userVote = null;
        const latestVote = await Vote.findOne({ where: { userId, pollId } });
        if (latestVote) userVote = latestVote.pollOptionId;

        const updatedPollData = JSON.stringify({
          pollId: poll.id,
          userVote,
          options: poll.options.map((opt) => ({
            id: opt.id,
            text: opt.optionText,
            votes: opt.votes,
          })),
        });

        // Broadcast to all clients
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
