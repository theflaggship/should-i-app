const { sequelize, User, Poll, PollOption, Comment } = require('./models'); // Import from models/index.js
const bcrypt = require('bcryptjs');

// A mapping of poll questions to relevant options
const questionOptionsMap = [
  {
    question: 'What should I eat for dinner?',
    options: ['Pizza', 'Burger', 'Salad', 'Pasta'],
  },
  {
    question: 'Which movie should I watch?',
    options: ['Inception', 'Interstellar', 'Matrix', 'Titanic'],
  },
  {
    question: 'Which guitar should I buy?',
    options: ['Epiphone DR-100', 'Yamaha FG800', 'Martin LX1E', 'Taylor 110e'],
  },
  {
    question: 'Where should I travel next?',
    options: ['Japan', 'Italy', 'Canada', 'Australia'],
  },
  {
    question: 'What programming language should I learn?',
    options: ['JavaScript', 'Python', 'Go', 'Rust'],
  },
  {
    question: 'Should I adopt a pet?',
    options: ['Yes, adopt a cat', 'Yes, adopt a dog', 'No, not now'],
  },
  {
    question: 'Which coding bootcamp should I attend?',
    options: ['Flatiron', 'AppAcademy', 'Hack Reactor', 'General Assembly'],
  },
  {
    question: 'Which phone should I purchase?',
    options: ['iPhone 14', 'Samsung S22', 'Google Pixel 7', 'OnePlus 10'],
  },
  {
    question: 'How should I spend my weekend?',
    options: ['Go hiking', 'Watch Netflix', 'Visit family', 'Attend a meetup'],
  },
  {
    question: 'Which book should I read next?',
    options: ['Sapiens', 'Dune', 'Atomic Habits', 'The Great Gatsby'],
  },
];

// Random comment texts
const commentTexts = [
  "I totally agree!",
  "Not sure about that...",
  "Great choice!",
  "I voted differently, but I see your point.",
  "This is a tough decision!",
  "I love this topic!",
  "Interesting take!",
  "I was thinking the same thing.",
  "That’s a hard one!",
  "I’d love to hear more opinions on this!"
];

async function seed() {
  try {
    await sequelize.sync({ force: true });
    console.log('Database synced (force: true).');

    // Create 5 users
    const users = [];
    for (let i = 1; i <= 5; i++) {
      const hashedPassword = await bcrypt.hash('password', 10);
      const user = await User.create({
        username: `User${i}`,
        email: `user${i}@example.com`,
        password: hashedPassword,
        profilePicture: 'https://picsum.photos/200/200',
      });
      users.push(user);
    }
    console.log('Created 5 users with hashed passwords.');

    // Create polls
    const polls = [];
    for (let user of users) {
      for (let p = 0; p < 3; p++) {
        const randomIndex = Math.floor(Math.random() * questionOptionsMap.length);
        const { question, options } = questionOptionsMap[randomIndex];

        const allowComments = Math.random() < 0.7;
        const newPoll = await Poll.create({
          userId: user.id,
          question,
          isPrivate: false,
          allowComments,
        });
        polls.push(newPoll);

        // Shuffle + pick a subset of 2 to 4 options
        const shuffledOpts = [...options].sort(() => 0.5 - Math.random());
        const numberOfOptions = Math.floor(Math.random() * 3) + 2; // 2, 3, or 4
        const chosenOpts = shuffledOpts.slice(0, numberOfOptions);

        // Create PollOption records, preserving the final order with 'sortOrder'
        chosenOpts.forEach((optText, idx) => {
          PollOption.create({
            pollId: newPoll.id,
            optionText: optText,
            votes: Math.floor(Math.random() * 10),
            sortOrder: idx, // <--- Assign index as the order
          });
        });
      }
    }
    console.log('Polls and options created.');

    // Add random comments
    for (let poll of polls) {
      if (poll.allowComments) {
        const numComments = Math.floor(Math.random() * 5);
        for (let i = 0; i < numComments; i++) {
          const randomUser = users[Math.floor(Math.random() * users.length)];
          const randomComment = commentTexts[Math.floor(Math.random() * commentTexts.length)];

          await Comment.create({
            pollId: poll.id,
            userId: randomUser.id,
            commentText: randomComment,
          });
        }
      }
    }
    console.log('Random comments added to polls.');

    console.log('Seeding complete.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
