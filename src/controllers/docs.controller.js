const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const { docsServcie } = require("../services");

const uploadDocs = catchAsync(async (req, res) => {
  const result = await docsServcie.uploadDocs(req);
  res.status(200).json({
    success: true,
    ...result,
  });
});

module.exports = {
  uploadDocs,
};
