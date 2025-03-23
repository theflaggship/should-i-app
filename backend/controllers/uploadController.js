// const AWS = require('aws-sdk');
// const { User } = require('../models');

// AWS.config.update({ region: process.env.AWS_REGION });

// const s3 = new AWS.S3();

// exports.getPresignedUrl = async (req, res, next) => {
//   const { filename, filetype } = req.body;
//   const Key = `profile-pics/${Date.now()}_${filename}`;

//   const url = s3.getSignedUrl('putObject', {
//     Bucket: process.env.AWS_S3_BUCKET,
//     Key,
//     ContentType: filetype,
//     ACL: 'public-read',
//     Expires: 60,
//   });

//   res.json({ uploadUrl: url, fileUrl: `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${Key}` });
// };

// exports.updateProfilePicture = async (req, res, next) => {
//   const user = await User.findByPk(req.user.id);
//   user.profilePicture = req.body.fileUrl;
//   await user.save();
//   res.json({ profilePicture: user.profilePicture });
// };
