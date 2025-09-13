const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: error.errors.map((err) => ({
        path: err.path.join("."),
        message: err.message,
      })),
    });
  }
};

module.exports = validate;
