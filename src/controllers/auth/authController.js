const { prisma, Prisma } = require("../../lib/prisma");
const asyncHandler = require("express-async-handler");
const { body, query, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const CustomError = require("../../errors/CustomError");

module.exports.handleLogin = [
  [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Please enter your email")
      .isEmail()
      .withMessage("Please enter a valid email address"),

    body("password").trim().notEmpty().withMessage("Please enter password"),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw new CustomError(
        "Input Error",
        "Some inputs are invalid. Please check and try again.",
        400,
        errors.array(),
      );
    }

    const { email, password } = req.body;

    const foundUser = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    // check if user exist
    if (!foundUser) {
      throw new CustomError(
        "Invalid login credentials",
        "Wrong username or password",
        400,
      );
    }

    // check password
    const match = await bcrypt.compare(password, foundUser.password);
    if (!match) {
      throw new CustomError(
        "Invalid login credentials",
        "Wrong username or password",
        400,
      );
    }

    // create access and refresh token
    const accessToken = jwt.sign(
      {
        id: foundUser.id,
        username: foundUser.username,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "10m" },
    );
    const refreshToken = jwt.sign(
      {
        id: foundUser.id,
        username: foundUser.username,
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "3d" },
    );

    // update refresh token in db
    const update = await prisma.user.update({
      where: { username: foundUser.username },
      data: { refreshToken: refreshToken },
    });

    // create and send secure cookie to user
    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // expire in 7 days
    });

    res.status(200).json({
      user: foundUser,
      accessToken,
    });
  }),
];
