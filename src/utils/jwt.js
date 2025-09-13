const jwt = require("jsonwebtoken");
const config = require("../config/config");


const generateTokens = (user) => {
  const payload = { userId: user.userId, email: user.email }; // use UUID

  const accessToken = jwt.sign(payload, config.jwt.jwtSecret, { expiresIn: "15m" });
  const refreshToken = jwt.sign(payload,config.jwt.jwtRefreshSecret, { expiresIn: "7d" });

  return { accessToken, refreshToken };
};

module.exports = { generateTokens };
