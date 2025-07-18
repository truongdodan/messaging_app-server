const allowedOrigin = require('../configs/allowedOrigins');

const credentials = (req, res, next) => {
    const origin = req.origin;

    if (allowedOrigin.includes(origin)) {
        res.header("Access-Control-Allowe-Credentials", true);
    }

    next(CustomError("Credential Error", "Origin not allowed."));
}

module.exports = credentials;