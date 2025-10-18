const allowedOrigins = require("./allowedOrigins");
const CustomError = require("../errors/CustomError");

const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.indexOf(origin) !== -1) {
      // remove !origin on deployment
      callback(null, true);

      console.log(allowedOrigins);
    } else {
      callback(
        new CustomError(
          "Request origin is not allowed",
          "This origin is not allowed by CORS."
        )
      );
    }
  },
  credentials: true,
  optionSuccessStatus: 200,
};

module.exports = corsOptions;
