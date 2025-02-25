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

// 3. Initialize each model by calling the factory with (sequelize, DataTypes)
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

// User <-> Poll (one-to-many)
User.hasMany(Poll, { foreignKey: 'userId' });
Poll.belongsTo(User, { foreignKey: 'userId' });

// Poll <-> PollOption (one-to-many)
Poll.hasMany(PollOption, {
  as: 'options',
  foreignKey: 'pollId',
});
PollOption.belongsTo(Poll, {
  as: 'poll',
  foreignKey: 'pollId',
});

// PollOption <-> Vote (one-to-many)
PollOption.hasMany(Vote, { foreignKey: 'pollOptionId' });
Vote.belongsTo(PollOption, { foreignKey: 'pollOptionId' });

// User <-> Vote (one-to-many)
User.hasMany(Vote, { foreignKey: 'userId' });
Vote.belongsTo(User, { foreignKey: 'userId' });

// Poll <-> Comment (one-to-many)
Poll.hasMany(Comment, { foreignKey: 'pollId' });
Comment.belongsTo(Poll, { foreignKey: 'pollId' });

// User <-> Comment (one-to-many)
User.hasMany(Comment, { foreignKey: 'userId' });
Comment.belongsTo(User, { foreignKey: 'userId' });

// Poll <-> Category (many-to-many) via PollCategory
Poll.belongsToMany(Category, { through: PollCategory, foreignKey: 'pollId' });
Category.belongsToMany(Poll, { through: PollCategory, foreignKey: 'categoryId' });

// Poll <-> AllowedUsers (many-to-many) via PollAllowedUsers
Poll.belongsToMany(User, { through: PollAllowedUsers, as: 'AllowedUsers', foreignKey: 'pollId' });
User.belongsToMany(Poll, { through: PollAllowedUsers, as: 'ExclusivePolls', foreignKey: 'userId' });

// User <-> User (self-referential many-to-many) via Follow
User.belongsToMany(User, { as: 'Followers', through: Follow, foreignKey: 'followingId' });
User.belongsToMany(User, { as: 'Following', through: Follow, foreignKey: 'followerId' });

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
  Follow
};
