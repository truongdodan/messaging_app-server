const { prisma, Prisma } = require("../../lib/prisma");
const asyncHandler = require("express-async-handler");
const { body, query, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const CustomError = require("../../errors/CustomError");

module.exports.handleRegister = [
  [
    body("email")
      .trim()
      .notEmpty()
      .isEmail()
      .withMessage("Must be an email.")
      .custom(async (email) => {
        const user = await prisma.user.findUnique({
          where: {
            email: email,
          },
        });

        if (user) {
          throw new CustomError(
            "Invalid input",
            "This email already been register",
            400,
          );
        }
      }),

    ,
    body("firstname")
      .trim()
      .notEmpty()
      .withMessage("Firstname cannot be empty"),

    body("lastname").trim().notEmpty().withMessage("Lastname cannot be empty"),

    body("username")
      .trim()
      .notEmpty()
      .withMessage("Username cannot be empty")
      .custom(async (username) => {
        const user = await prisma.user.findUnique({
          where: {
            username: username,
          },
          select: {
            username: true,
          },
        });

        if (user) {
          throw new CustomError(
            "Invalid input",
            "User with this username already exists",
            400,
          );
        }
      }),

    body("password")
      .trim()
      .notEmpty()
      .withMessage("Password cannot be empty")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z\d!@#$%^&*]{8,}$/,
      )
      .withMessage(
        "Password must be atleast 8 characters with letters, numbers, and a symbol",
      ),

    body("confirmedPassword")
      .trim()
      .notEmpty()
      .withMessage("Confirmed password cannot empty")
      .custom(async (confirmedPassword, { req }) => {
        const password = req.body.password;

        if (confirmedPassword !== password) {
          throw new CustomError(
            "Invalid input",
            "The confirmed password and password does not match.",
            400,
          );
        }
      }),
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

    // make sure username is unique.
    const { email, firstname, lastname, username, password } = req.body;

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        firstname: firstname,
        lastname: lastname,
        username: username,
      },
      select: {
        id: true,
        username: true,
      },
    });

    // add new user to global conversation
    await prisma.participant.create({
      data: {
        conversation: {
          connect: { id: process.env.GLOBAL_CONVERSATION_ID },
        },
        user: {
          connect: { id: newUser.id },
        },
      },
    });

    console.log("User added to global conversation: ", newUser.username);

    res.status(201).send(newUser.username);
  }),
];
