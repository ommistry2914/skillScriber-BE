const User = require("../models/user.model");
const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");

const createUser = async ({ body }) => {
  const { firstName,lastName, email, password } = body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User already exists");
  }

  const user = await User.create({ firstName,lastName, email, password });
  return user;
};

const getUsers = async ({ query }) => {
  const users = await User.find(query);
  return {
    count: users.length,
    users,
  };
};

module.exports = {
  createUser,
  getUsers,
};
