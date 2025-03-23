// backend/seeds.js

const { sequelize, User, Poll, PollOption, Comment, Follow } = require('./models');
const bcrypt = require('bcryptjs');

const questionOptionsMap = [
  { question: 'What should I eat for dinner?', options: ['Pizza','Burger','Salad','Pasta'] },
  { question: 'Which movie should I watch?', options: ['Inception','Interstellar','Matrix','Titanic'] },
  { question: 'Which guitar should I buy?', options: ['Epiphone DR-100','Yamaha FG800','Martin LX1E','Taylor 110e'] },
  { question: 'Where should I travel next?', options: ['Japan','Italy','Canada','Australia'] },
  { question: 'What programming language should I learn?', options: ['JavaScript','Python','Go','Rust'] },
  { question: 'Should I adopt a pet?', options: ['Yes, adopt a cat','Yes, adopt a dog','No, not now'] },
  { question: 'Which coding bootcamp should I attend?', options: ['Flatiron','AppAcademy','Hack Reactor','General Assembly'] },
  { question: 'Which phone should I purchase?', options: ['iPhone 14','Samsung S22','Google Pixel 7','OnePlus 10'] },
  { question: 'How should I spend my weekend?', options: ['Go hiking','Watch Netflix','Visit family','Attend a meetup'] },
  { question: 'Which book should I read next?', options: ['Sapiens','Dune','Atomic Habits','The Great Gatsby'] },
];

const commentTexts = [
  "I totally agree!", "Not sure about that...", "Great choice!",
  "I voted differently, but I see your point.", "This is a tough decision!",
  "I love this topic!", "Interesting take!", "I was thinking the same thing.",
  "That’s a hard one!", "I’d love to hear more opinions on this!"
];

async function seed() {
  try {
    await sequelize.sync({ force: true });
    console.log('Database synced (force: true).');

    // === Default profile pictures: replace these URLs with your actual hosted images ===
    const defaultPics = [
      'https://i.imgur.com/skNociU.png',
      'https://i.imgur.com/kWDmtJk.png',
      'https://i.imgur.com/vSh7C3e.png',
      'https://i.imgur.com/UeATFBH.png',
      'https://i.imgur.com/jGO1Hp2.png',
      'https://i.imgur.com/EFfkzGt.png',
      'https://i.imgur.com/yM0mKXq.png',
    ];

    const defaultSummaries = [
      'I love coding.', 'Tech enthusiast.', 'Coffee addict.',
      'Traveler at heart.', 'Full-stack developer.', 'Book lover.', 'Music junkie.'
    ];

    // Create 10 users
    const users = [];
    for (let i = 1; i <= 10; i++) {
      const hashedPassword = await bcrypt.hash('password', 10);
      const displayName = Math.random() < 0.5 ? `User ${i}` : null;
      const personalSummary = Math.random() < 0.5 
        ? defaultSummaries[Math.floor(Math.random() * defaultSummaries.length)]
        : null;
      const profilePicture = defaultPics[Math.floor(Math.random() * defaultPics.length)];

      const user = await User.create({
        username: `User${i}`,
        email: `user${i}@example.com`,
        password: hashedPassword,
        displayName,
        personalSummary,
        profilePicture,
      });
      users.push(user);
    }
    console.log('Created 10 users.');

    // Create follow relationships
    for (const follower of users) {
      const followees = users.filter(u => u.id !== follower.id)
                            .sort(() => Math.random() - 0.5)
                            .slice(0, 2);
      for (const followee of followees) {
        await Follow.create({ followerId: follower.id, followingId: followee.id });
      }
    }
    console.log('Seeded follow relationships.');

    // Create polls & options
    const polls = [];
    for (const user of users) {
      for (let j = 0; j < 3; j++) {
        const { question, options } = questionOptionsMap[Math.floor(Math.random() * questionOptionsMap.length)];
        const allowComments = Math.random() < 0.7;
        const poll = await Poll.create({ userId: user.id, question, isPrivate: false, allowComments });
        polls.push(poll);

        const chosen = options.sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 3) + 2);
        for (let idx = 0; idx < chosen.length; idx++) {
          await PollOption.create({
            pollId: poll.id,
            optionText: chosen[idx],
            votes: Math.floor(Math.random() * 10),
            sortOrder: idx,
          });
        }
      }
    }
    console.log('Created polls & options.');

    // Seed comments
    for (const poll of polls) {
      if (poll.allowComments) {
        const count = Math.floor(Math.random() * 5);
        for (let k = 0; k < count; k++) {
          const commenter = users[Math.floor(Math.random() * users.length)];
          await Comment.create({
            pollId: poll.id,
            userId: commenter.id,
            commentText: commentTexts[Math.floor(Math.random() * commentTexts.length)],
          });
        }
      }
    }
    console.log('Seeded comments.');

    console.log('✅ Seed complete.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

seed();
