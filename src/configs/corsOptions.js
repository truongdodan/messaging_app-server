const allowedOrigins = require("./allowedOrigins");
const CustomError = require("../errors/CustomError");

const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      // remove !origin on deployment
      callback(null, true);
    } else {
      callback(
        new CustomError(
          "Request origin is not allowed",
          "This origin is not allowed by CORS."
        )
      );
    }
  },
  //   credentials: true,
  optionSuccessStatus: 200,
};

module.exports = corsOptions;
