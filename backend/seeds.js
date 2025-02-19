// seeds.js
const sequelize = require('./config/database');
const { 
  User, Poll, PollOption, Vote, Comment, Category, 
  PollCategory, PollAllowedUsers, Follow 
} = require('./models');

// Utility function to get a random element from an array
function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {
  try {
    // 1. Sync the database (force: true drops existing tables, so use with caution)
    await sequelize.sync({ force: true });
    console.log('Database synced.');

    // 2. Create 10 Users
    let usersData = [];
    for (let i = 1; i <= 10; i++) {
      usersData.push({
        username: `user${i}`,
        password: 'password',  // In production, hash your passwords!
        email: `user${i}@example.com`,
        profilePicture: 'https://via.placeholder.com/150',
        personalSummary: `I am user${i}.`
      });
    }
    const users = await User.bulkCreate(usersData, { returning: true });
    console.log('Users created.');

    // 3. Create some Categories
    const categoriesData = [
      { name: 'Travel' },
      { name: 'Politics' },
      { name: 'Food' },
      { name: 'Technology' },
      { name: 'Lifestyle' }
    ];
    const categories = await Category.bulkCreate(categoriesData, { returning: true });
    console.log('Categories created.');

    // 4. Create Polls
    const pollQuestions = [
      'Should I travel to Japan?',
      'Should I invest in cryptocurrency?',
      'Should I adopt a pet?',
      'Should I change my career path?',
      'Should I start a new hobby?',
      'Should I try a new restaurant?',
      'Should I buy a new phone?',
      'Should I take a vacation?',
      'Should I enroll in a course?',
      'Should I redecorate my home?'
    ];

    let polls = [];
    for (let i = 0; i < pollQuestions.length; i++) {
      // Choose a random creator from our users
      const creator = getRandomElement(users);
      const poll = await Poll.create({
        userId: creator.id,
        question: pollQuestions[i],
        isPrivate: Math.random() < 0.5,           // 50% chance the poll is private
        allowComments: Math.random() < 0.8,        // 80% chance to allow comments
        expirationDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000), // expires within a week
        isImagePoll: false
      });

      // Randomly assign 1 or 2 categories to the poll
      let assignedCategories = [];
      let numCategories = Math.floor(Math.random() * 2) + 1;
      for (let j = 0; j < numCategories; j++) {
        assignedCategories.push(getRandomElement(categories));
      }
      // Ensure we don’t have duplicate categories
      assignedCategories = [...new Set(assignedCategories.map(c => c.id))];
      for (let catId of assignedCategories) {
        await PollCategory.create({
          pollId: poll.id,
          categoryId: catId
        });
      }

      polls.push(poll);
    }
    console.log('Polls created.');

    // 5. Create PollOptions for each poll (each poll gets between 2 and 4 options)
    for (let poll of polls) {
      let numOptions = Math.floor(Math.random() * 3) + 2; // random number between 2 and 4
      for (let i = 1; i <= numOptions; i++) {
        await PollOption.create({
          pollId: poll.id,
          optionText: `Option ${i} for poll ${poll.id}`,
          optionImage: null
        });
      }
    }
    console.log('PollOptions created.');

    // 6. Create Votes for each poll
    // For each poll, let some random users (excluding the creator) cast a vote.
    for (let poll of polls) {
      // Get poll options for this poll
      const options = await PollOption.findAll({ where: { pollId: poll.id } });
      // Exclude the creator from the potential voters
      const potentialVoters = users.filter(user => user.id !== poll.userId);
      // Shuffle the array randomly
      potentialVoters.sort(() => 0.5 - Math.random());
      // Decide on a random number of votes (up to the number of potential voters)
      const numVotes = Math.floor(Math.random() * potentialVoters.length);
      for (let i = 0; i < numVotes; i++) {
        const option = getRandomElement(options);
        await Vote.create({
          userId: potentialVoters[i].id,
          pollId: poll.id,
          pollOptionId: option.id
        });
      }
    }
    console.log('Votes created.');

    // 7. Create Comments for polls that allow comments
    for (let poll of polls) {
      if (poll.allowComments) {
        // Randomly decide how many comments to create (0 to 5)
        const numComments = Math.floor(Math.random() * 6);
        // Exclude the poll creator to diversify commenters
        const potentialCommenters = users.filter(user => user.id !== poll.userId);
        for (let i = 0; i < numComments; i++) {
          const commenter = getRandomElement(potentialCommenters);
          await Comment.create({
            pollId: poll.id,
            userId: commenter.id,
            commentText: `This is comment ${i + 1} on poll ${poll.id}`
          });
        }
      }
    }
    console.log('Comments created.');

    // 8. Create Follow relationships among users (each user follows 1 to 3 other users)
    for (let user of users) {
      // Filter out self and then shuffle the array of potential followees
      let followees = users.filter(u => u.id !== user.id);
      followees.sort(() => 0.5 - Math.random());
      // Decide randomly how many users to follow (between 1 and 3)
      let numFollow = Math.floor(Math.random() * 3) + 1;
      followees = followees.slice(0, numFollow);
      for (let followee of followees) {
        await Follow.create({
          followerId: user.id,
          followingId: followee.id
        });
      }
    }
    console.log('Follow relationships created.');

    // 9. For private polls, create PollAllowedUsers entries (simulate exclusive polls)
    for (let poll of polls) {
      if (poll.isPrivate) {
        // Choose 1 to 3 allowed users (excluding the creator)
        let allowedUsers = users.filter(user => user.id !== poll.userId);
        allowedUsers.sort(() => 0.5 - Math.random());
        let numAllowed = Math.floor(Math.random() * 3) + 1;
        allowedUsers = allowedUsers.slice(0, numAllowed);
        for (let allowed of allowedUsers) {
          await PollAllowedUsers.create({
            pollId: poll.id,
            userId: allowed.id
          });
        }
      }
    }
    console.log('PollAllowedUsers created.');

    console.log('Seeding complete.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
