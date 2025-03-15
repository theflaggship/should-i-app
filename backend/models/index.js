// models/index.js
const { Sequelize, DataTypes } = require('sequelize');
const dbConfig = require('../config/database');

// 1. Create the Sequelize instance
const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  dialect: dbConfig.dialect,
  port: dbConfig.port,
  logging: false,
});

// 2. Import model factory functions
const UserFactory = require('./User');
const PollFactory = require('./Poll');
const PollOptionFactory = require('./PollOption');
const VoteFactory = require('./Vote');
const CommentFactory = require('./Comment');
const CategoryFactory = require('./Category');
const PollCategoryFactory = require('./PollCategory');
const PollAllowedUsersFactory = require('./PollAllowedUsers');
const FollowFactory = require('./Follow');

// 3. Initialize each model by calling the factory
const User = UserFactory(sequelize, DataTypes);
const Poll = PollFactory(sequelize, DataTypes);
const PollOption = PollOptionFactory(sequelize, DataTypes);
const Vote = VoteFactory(sequelize, DataTypes);
const Comment = CommentFactory(sequelize, DataTypes);
const Category = CategoryFactory(sequelize, DataTypes);
const PollCategory = PollCategoryFactory(sequelize, DataTypes);
const PollAllowedUsers = PollAllowedUsersFactory(sequelize, DataTypes);
const Follow = FollowFactory(sequelize, DataTypes);

// 4. Define associations

// ─────────────────────────────────────────────────────────────────────────────
// User <-> Poll (one-to-many)
// ─────────────────────────────────────────────────────────────────────────────
User.hasMany(Poll, {
  as: 'polls',
  foreignKey: 'userId',
});
Poll.belongsTo(User, {
  as: 'user',
  foreignKey: 'userId',
});

// ─────────────────────────────────────────────────────────────────────────────
// Poll <-> PollOption (one-to-many)
// ─────────────────────────────────────────────────────────────────────────────
Poll.hasMany(PollOption, {
  as: 'options',
  foreignKey: 'pollId',
});
PollOption.belongsTo(Poll, {
  as: 'poll',
  foreignKey: 'pollId',
});

// ─────────────────────────────────────────────────────────────────────────────
// PollOption <-> Vote (one-to-many)
// ─────────────────────────────────────────────────────────────────────────────
PollOption.hasMany(Vote, {
  as: 'optionVotes',
  foreignKey: 'pollOptionId',
});
Vote.belongsTo(PollOption, {
  as: 'pollOption',
  foreignKey: 'pollOptionId',
});

// ─────────────────────────────────────────────────────────────────────────────
// User <-> Vote (one-to-many)
// ─────────────────────────────────────────────────────────────────────────────
User.hasMany(Vote, {
  as: 'votes',
  foreignKey: 'userId',
});
Vote.belongsTo(User, {
  as: 'user',
  foreignKey: 'userId',
});

// ─────────────────────────────────────────────────────────────────────────────
// Poll <-> Comment (one-to-many)
// ─────────────────────────────────────────────────────────────────────────────
Poll.hasMany(Comment, {
  as: 'comments',
  foreignKey: 'pollId',
});
Comment.belongsTo(Poll, {
  as: 'poll',
  foreignKey: 'pollId',
});

// ─────────────────────────────────────────────────────────────────────────────
// User <-> Comment (one-to-many)
// ─────────────────────────────────────────────────────────────────────────────
User.hasMany(Comment, {
  as: 'comments',
  foreignKey: 'userId',
});
Comment.belongsTo(User, {
  as: 'user',
  foreignKey: 'userId',
});

// ─────────────────────────────────────────────────────────────────────────────
// Poll <-> Category (many-to-many) via PollCategory
// ─────────────────────────────────────────────────────────────────────────────
Poll.belongsToMany(Category, {
  as: 'categories',
  through: PollCategory,
  foreignKey: 'pollId',
});
Category.belongsToMany(Poll, {
  as: 'polls',
  through: PollCategory,
  foreignKey: 'categoryId',
});

// ─────────────────────────────────────────────────────────────────────────────
// Poll <-> AllowedUsers (many-to-many) via PollAllowedUsers
// ─────────────────────────────────────────────────────────────────────────────
Poll.belongsToMany(User, {
  as: 'allowedUsers',
  through: PollAllowedUsers,
  foreignKey: 'pollId',
});
User.belongsToMany(Poll, {
  as: 'exclusivePolls',
  through: PollAllowedUsers,
  foreignKey: 'userId',
});

// ─────────────────────────────────────────────────────────────────────────────
// User <-> User (self-referential many-to-many) via Follow
// ─────────────────────────────────────────────────────────────────────────────
User.belongsToMany(User, {
  as: 'followers',
  through: Follow,
  foreignKey: 'followingId',
  otherKey: 'followerId',
});

User.belongsToMany(User, {
  as: 'following',
  through: Follow,
  foreignKey: 'followerId',
  otherKey: 'followingId',
});

// Associate Follow with both sides of the relationship
Follow.belongsTo(User, { as: 'follower', foreignKey: 'followerId' });
Follow.belongsTo(User, { as: 'following', foreignKey: 'followingId' });

// 5. Export the Sequelize instance and all models
module.exports = {
  sequelize,
  User,
  Poll,
  PollOption,
  Vote,
  Comment,
  Category,
  PollCategory,
  PollAllowedUsers,
  Follow,
};
