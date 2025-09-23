const allowedOrigin = require("../configs/allowedOrigins");
const CustomError = require("../errors/CustomError");

const credentials = (req, res, next) => {
  const origin = req.headers.origin;

  if (allowedOrigin.includes(origin)) {
    res.header("Access-Control-Allow-Credentials", true);
  }

  next();
};

module.exports = credentials;
