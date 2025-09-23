const prisma = require("../../lib/prisma");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const CustomError = require("../../errors/CustomError");

module.exports = asyncHandler(async (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) return res.sendStatus(204);

  // check if user have this cookies
  const refreshToken = cookies.jwt;
  const foundUser = await prisma.user.findFirst({
    where: {
      id: req.id,
      refreshToken: refreshToken,
    },
  });

  // no user found, delete cookies
  if (!foundUser) {
    res.clearCookie("jwt", { httpOnly: true, secure: true, sameSite: "none" });
    res.sendStatus(204);
  }

  // delete refresh token in database
  const update = await prisma.user.update({
    where: { id: foundUser.id },
    data: { refreshToken: "" },
  });

  // found user, still delete cookies
  res.clearCookie("jwt", { httpOnly: true, secure: true, sameSite: "none" });
  res.sendStatus(204);
});
