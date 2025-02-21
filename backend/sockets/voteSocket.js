const { Poll, PollOption } = require('../models');

const setupVoteSocket = (wss) => {
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');

    ws.on('message', async (message) => {
      try {
        const { pollId, optionId } = JSON.parse(message);

        // Update database
        const option = await PollOption.findByPk(optionId);
        if (!option) return;

        option.votes += 1;
        await option.save();

        // Get updated poll data
        const poll = await Poll.findByPk(pollId, {
          include: [{ model: PollOption, attributes: ['id', 'optionText', 'votes'] }],
        });

        // Broadcast updated poll to all clients
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
