// backend/sockets/voteSocket.js
const { Poll, PollOption, Vote } = require('../models');

const setupVoteSocket = (wss) => {
  wss.on('connection', (ws) => {
    console.log('Client connected to Vote WebSocket');

    ws.on('message', async (rawMessage) => {
      try {
        const { userId, pollId, pollOptionId } = JSON.parse(rawMessage);
        if (!userId || !pollId || !pollOptionId) {
          console.error('Missing userId, pollId, or pollOptionId');
          return;
        }

        // 1. Check if user already voted in this poll
        let existingVote = await Vote.findOne({ where: { userId, pollId } });
        if (existingVote) {
          // User has an existing vote
          if (existingVote.pollOptionId === pollOptionId) {
            // A) User tapped the same option => remove vote (unvote)
            await existingVote.destroy();

            // Decrement that option's votes
            const sameOption = await PollOption.findByPk(pollOptionId);
            if (sameOption) {
              sameOption.votes = Math.max(sameOption.votes - 1, 0);
              await sameOption.save();
            }
          } else {
            // B) User tapped a different option => switch vote
            // Decrement old option
            const oldOption = await PollOption.findByPk(existingVote.pollOptionId);
            if (oldOption) {
              oldOption.votes = Math.max(oldOption.votes - 1, 0);
              await oldOption.save();
            }
            // Update the existing vote to the new option
            existingVote.pollOptionId = pollOptionId;
            await existingVote.save();

            // Increment new option
            const newOption = await PollOption.findByPk(pollOptionId);
            if (newOption) {
              newOption.votes += 1;
              await newOption.save();
            }
          }
        } else {
          // C) No existing vote => create a new vote
          await Vote.create({ userId, pollId, pollOptionId });

          // Increment that option's vote count
          const option = await PollOption.findByPk(pollOptionId);
          if (option) {
            option.votes += 1;
            await option.save();
          }
        }

        // 2. Broadcast updated poll data (including new total votes)
        const poll = await Poll.findByPk(pollId, {
          include: [
            {
              model: PollOption,
              as: 'options',        // Must match the alias in your model
              attributes: ['id', 'optionText', 'votes', 'sortOrder'],
              order: [['sortOrder', 'ASC']]
            },
          ],
        });

        // Construct the updated data to send
        const updatedPollData = JSON.stringify({
          pollId: poll.id,
          options: poll.options.map((opt) => ({
            id: opt.id,
            text: opt.optionText,     // rename to text
            votes: opt.votes,
          })),
        });

        // Broadcast to all connected WebSocket clients
        wss.clients.forEach((client) => {
          if (client.readyState === ws.OPEN) {
            client.send(updatedPollData);
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
