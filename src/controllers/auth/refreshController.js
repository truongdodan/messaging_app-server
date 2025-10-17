const { prisma, Prisma } = require("../../lib/prisma");
const asyncHandler = require("express-async-handler");
const { body, query } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const CustomError = require("../../errors/CustomError");
const fileService = require("../../services/fileService");

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
      refreshToken: refreshToken,
    },
  });

  if (!foundUser) {
    throw new CustomError("Unauthorized", "Invalid refresh token", 401);
  }

  // verify and send back new access token
  // CHANGE: Use try-catch instead of callback, or handle error properly in callback
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    if (decoded.username !== foundUser.username) {
      throw new CustomError("Unauthorized", "Invalid refresh token", 401);
    }

    const accessToken = jwt.sign(
      {
        id: foundUser.id,
        username: foundUser.username,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    // Attach URLs to user
    if (foundUser.profileUrl) {
      foundUser.profileUrl = fileService.getPublicUrl(foundUser.profileUrl);
    }
    if (foundUser.coverUrl) {
      foundUser.coverUrl = fileService.getPublicUrl(foundUser.coverUrl);
    }

    res.status(200).json({
      user: foundUser,
      accessToken,
    });
  } catch (err) {
    throw new CustomError("Unauthorized", "Invalid refresh token", 401);
  }
});
