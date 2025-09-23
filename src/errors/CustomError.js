class CustomError extends Error {
  constructor(
    name = "Custom Error",
    message = "An Error occurs while running",
    statusCode = 500,
    errorDetails = {},
  ) {
    super(message);
    this.name = name;
    this.statusCode = statusCode;
    this.errorDetails = errorDetails;
  }
}

module.exports = CustomError;
