const catchAsync = require("../utils/catchAsync");
const { authService } = require("../services");

const loginUser = catchAsync(async (req, res) => {
  const result = await authService.loginUser(req);
  res.send(result);
});

module.exports = { loginUser };
