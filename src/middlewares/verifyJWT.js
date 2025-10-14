const prisma = require("../lib/prisma");
const asyncHandler = require("express-async-handler");
const { body, query } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const CustomError = require("../errors/CustomError");

module.exports = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw new CustomError("Unauthorized", "Login is required.", 401);
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return next(
        new CustomError(
          "Invalid token",
          "Access denied. Invalid or expired token.",
          401,
        ),
      );
    }

    req.id = decoded.id;
    req.username = decoded.username;
    next();
  });
});
