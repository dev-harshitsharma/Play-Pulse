import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';
import { uploadFileOnCloud } from '../utils/cloudinary.js';

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const fetchedUser = User.findById(userId);
    const accessToken = fetchedUser.generateAccessToken();
    const refreshToken = fetchedUser.generateRefreshToken();

    fetchedUser.refreshToken = refreshToken;
    fetchedUser.accessToken = accessToken;
    await fetchedUser.save({ validateBeforeSave: false });

    return { refreshToken, accessToken };
  } catch (error) {
    throw new ApiError(
      500,
      'Something went wrong while generating refresh and access token '
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;
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
  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath;
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverImageLocalPath = req.files.coverImage[0].path
  }

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

  const newUserInDb = await User.findById(createdUser._id).select(
    '-password -refreshToken'
  );

  if (!newUserInDb) {
    throw new ApiError(500, 'Something went wrong while regestring a user ');
  }

  return res  
    .status(201)
    .json(new ApiResponse(200, newUserInDb, 'User Registered Successsfully'));
});

const logInUser = asyncHandler(async(req,res) =>{
    const {email,username,password} = req.body;

    if(!username || !email){
      throw new ApiError(400,"Username or email is required")
    }

    const fetchedUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if(!fetchedUser){
      throw new ApiError(404,"User Does not exist")
    }

    const isPasswordValid = await fetchedUser.isPassWordCorrect(password)

    if(!isPasswordValid){
      throw new ApiError(401,"Password Incorrect")
    }

    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id);

    //send it to cookies 
    const loggedInUser = await User.findById(fetchedUser._id).select("-password -refreshToken")

    const options={
      httpOnly:true,
      secure:true,
    }

    return res
      .status(200)
      .cookie('accessToken', accessToken, options)
      .cookie('refreshToken', refreshToken, options)
      .json(
        new ApiResponse(200, {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged In Successfully"
      )
      );
})

const logOutUser =asyncHandler(async(req,res) =>{
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        refreshToken:undefined
      }
    },
    {
      new:true
    }
  )

  const options={
    httpOnly:true,
    secure:true,
  }

  return res
    .status(200)
    .clearCookie('accessToken', options)
    .clearCookie('refreshToken', options)
    .json(new ApiResponse(200, {}, 'User Logged Out Successfully'));
})

export { registerUser,logInUser,logOutUser };
