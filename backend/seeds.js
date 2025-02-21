// seed.js
const { sequelize, User, Poll, PollOption } = require('./models'); // Import from models/index.js
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

async function seed() {
  try {
    // 1. Recreate tables
    await sequelize.sync({ force: true });
    console.log('Database synced (force: true).');

    // 2. Create 10 users with hashed password
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
    console.log('Created 10 users with hashed passwords.');

    // 3. For each user, create 3 polls
    for (let user of users) {
      for (let p = 0; p < 3; p++) {
        // Pick a random question from questionOptionsMap
        const randomIndex = Math.floor(Math.random() * questionOptionsMap.length);
        const { question, options } = questionOptionsMap[randomIndex];

        // Create the poll
        const newPoll = await Poll.create({
          userId: user.id,
          question,
          isPrivate: false,
          allowComments: true,
        });

        // Shuffle the relevant options
        const shuffledOpts = [...options].sort(() => 0.5 - Math.random());
        // Decide how many options (2 to 4)
        const numberOfOptions = Math.floor(Math.random() * 3) + 2; // 2, 3, or 4
        const chosenOpts = shuffledOpts.slice(0, numberOfOptions);

        // Create PollOption records
        for (let optText of chosenOpts) {
          await PollOption.create({
            pollId: newPoll.id,
            optionText: optText,
          });
        }
      }
    }
    console.log('Polls and options created for each user.');

    console.log('Seeding complete.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
