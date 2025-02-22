// voteSocket.js
const { Poll, PollOption, Vote } = require('../models');

const setupVoteSocket = (wss) => {
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');

    ws.on('message', async (rawMessage) => {
      try {
        // Parse the incoming data
        const { userId, pollId, pollOptionId } = JSON.parse(rawMessage);

        if (!userId || !pollId) {
          console.error('Missing userId or pollId');
          return;
        }

        // Check if user already voted in this poll
        let existingVote = await Vote.findOne({ where: { userId, pollId } });

        if (existingVote) {
          // User already voted in this poll
          if (existingVote.pollOptionId === pollOptionId) {
            // User tapped the same option → remove the vote (unvote)
            await existingVote.destroy();

            // Decrement that option's vote count
            const sameOption = await PollOption.findByPk(pollOptionId);
            if (sameOption) {
              sameOption.votes = Math.max(sameOption.votes - 1, 0);
              await sameOption.save();
            }
          } else {
            // User changing vote to a different option
            // Decrement old option's count
            const oldOption = await PollOption.findByPk(existingVote.pollOptionId);
            if (oldOption) {
              oldOption.votes = Math.max(oldOption.votes - 1, 0);
              await oldOption.save();
            }

            // Update existing vote to new option
            existingVote.pollOptionId = pollOptionId;
            await existingVote.save();

            // Increment new option's count
            const newOption = await PollOption.findByPk(pollOptionId);
            if (newOption) {
              newOption.votes += 1;
              await newOption.save();
            }
          }
        } else {
          // No existing vote, user is voting for the first time in this poll
          await Vote.create({ userId, pollId, pollOptionId });

          // Increment that option's vote count
          const option = await PollOption.findByPk(pollOptionId);
          if (option) {
            option.votes += 1;
            await option.save();
          }
        }

        // Broadcast updated poll data
        const poll = await Poll.findByPk(pollId, {
          include: [{ model: PollOption, attributes: ['id', 'optionText', 'votes'] }],
        });

        const updatedPoll = JSON.stringify({ pollId, options: poll.PollOptions });
        wss.clients.forEach((client) => {
          if (client.readyState === ws.OPEN) {
            client.send(updatedPoll);
          }
        });

      } catch (error) {
        console.error('WebSocket Error:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });
};

module.exports = setupVoteSocket;
