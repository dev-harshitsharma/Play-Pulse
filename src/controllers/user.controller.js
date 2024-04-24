import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';
import { uploadFileOnCloud } from '../utils/cloudinary.js';

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;
  console.log(
    'Details Body',
    fullName,
    ' ',
    email,
    ' ',
    username,
    ' ',
    password
  );
  if (
    [fullName, email, username, password].some((fields) => fields.trim() === '')
  ) {
    throw new ApiError('400', 'All Fields are required');
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, 'User with email or username already exists');
  }
  console.log('Req.files', req.files);
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  const avatar = await uploadFileOnCloud(avatarLocalPath);
  const coverImage = await uploadFileOnCloud(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, 'Avatar file is required');
  }

  const createdUser = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || '',
    email,
    password,
    username: username.toLowerCase(),
  });
  console.log('User Added Succesfully', createdUser);

  const newUserInDb = await User.findById(createdUser._id).select(
    '-password -refreshToken'
  );

  if (!newUserInDb) {
    throw new ApiError(500, 'Something went wrong while regestring a user ');
  }

  return res
    .status(201)
    .json(new ApiResponse(200, 'User Registered Successsfully'));
});

export { registerUser };
