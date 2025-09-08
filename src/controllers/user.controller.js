const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { userService } = require('../services');

const createUser = catchAsync(async (req, res) => {
	const users = await userService.createUser(req);
	res.send({ users });
});


module.exports = {
	createUser,
};
