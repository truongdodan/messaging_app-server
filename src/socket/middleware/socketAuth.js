const jwt = require("jsonwebtoken");
const prisma = require("../../lib/prisma");
const asyncHandler = require("express-async-handler");
const CustomError = require("../errors/CustomError");

module.exports = async (socket, next) => {
  try {
    //get token
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(
        new CustomError("Unauthorized", "Authentication Token required.", 401),
      );
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const foundUser = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
    });

    if (!foundUser) {
      return next(new CustomError("Unauthorized", "User not found.", 401));
    }

    // attach user infor to socket
    socket.userId = decoded.id;
    socket.user = foundUser;

    next();
  } catch (err) {
    next(
      new CustomError(
        "Socket Unauthorized",
        "Invalid Token Authentication.",
        401,
      ),
    );
  }
};
