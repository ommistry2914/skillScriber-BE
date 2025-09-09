const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { docsServcie } = require('../services');

const uploadDocs = catchAsync(async (req, res) => {
	const docs = await docsServcie.uploadDocs(req);
	res.send({ docs });
});


module.exports = {
	uploadDocs,
};
