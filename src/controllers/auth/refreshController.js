const prisma = require("../../lib/prisma");
const asyncHandler = require("express-async-handler");
const { body, query } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const CustomError = require("../../errors/CustomError");

module.exports = asyncHandler(async (req, res) => {
  const cookies = req.cookies;

  // check if cookie for refresh exists
  if (!cookies?.jwt) {
    throw new CustomError("Unauthorized", "Refresh token not found", 401);
  }

  const refreshToken = cookies.jwt;

  // check if user with this refresh token exists
  const foundUser = await prisma.user.findFirst({
    where: {
      id: req.id,
      refreshToken: refreshToken,
    },
  });

  if (!foundUser) {
    throw new CustomError("Unauthorized", "Invalid refresh token", 401);
  }

  // verify and send back new access token
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
    if (err || decoded.username !== foundUser.username) {
      throw new CustomError("Unauthorized", "Invalid refresh token", 401);
    }

    const accessToken = jwt.sign(
      {
        id: foundUser.id,
        username: foundUser.username,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "10m" },
    );

    res.status(200).json({
      user: foundUser,
      accessToken,
    });
  });
});
