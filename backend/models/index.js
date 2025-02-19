const User = require('./User');
const Poll = require('./Poll');
const PollOption = require('./PollOption');
const Vote = require('./Vote');
const Comment = require('./Comment');
const Category = require('./Category');
const PollCategory = require('./PollCategory');
const PollAllowedUsers = require('./PollAllowedUsers');
const Follow = require('./Follow');

// Association between User and Poll (one-to-many)
User.hasMany(Poll, { foreignKey: 'userId' });
Poll.belongsTo(User, { foreignKey: 'userId' });

// Association between Poll and PollOption (one-to-many)
Poll.hasMany(PollOption, { foreignKey: 'pollId' });
PollOption.belongsTo(Poll, { foreignKey: 'pollId' });

// Association between PollOption and Vote (one-to-many)
PollOption.hasMany(Vote, { foreignKey: 'pollOptionId' });
Vote.belongsTo(PollOption, { foreignKey: 'pollOptionId' });

// Association between User and Vote (one-to-many)
User.hasMany(Vote, { foreignKey: 'userId' });
Vote.belongsTo(User, { foreignKey: 'userId' });

// Association between Poll and Comment (one-to-many)
Poll.hasMany(Comment, { foreignKey: 'pollId' });
Comment.belongsTo(Poll, { foreignKey: 'pollId' });

// Association between User and Comment (one-to-many)
User.hasMany(Comment, { foreignKey: 'userId' });
Comment.belongsTo(User, { foreignKey: 'userId' });

// Many-to-Many: Poll and Category via PollCategory
Poll.belongsToMany(Category, { through: PollCategory, foreignKey: 'pollId' });
Category.belongsToMany(Poll, { through: PollCategory, foreignKey: 'categoryId' });

// Many-to-Many: Poll and allowed Users via PollAllowedUsers (for exclusive polls)
Poll.belongsToMany(User, { through: PollAllowedUsers, as: 'AllowedUsers', foreignKey: 'pollId' });
User.belongsToMany(Poll, { through: PollAllowedUsers, as: 'ExclusivePolls', foreignKey: 'userId' });

// Self-referential Many-to-Many: User follows other Users via Follow
User.belongsToMany(User, { as: 'Followers', through: Follow, foreignKey: 'followingId' });
User.belongsToMany(User, { as: 'Following', through: Follow, foreignKey: 'followerId' });

module.exports = {
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