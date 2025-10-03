const { prisma, Prisma } = require("../lib/prisma");
const asyncHandler = require("express-async-handler");
const { body, query, validationResult, param } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const CustomError = require("../errors/CustomError");

module.exports.getAny = [
  [
    query("search_query").optional().trim(),

    query("is_friend")
      .optional()
      .trim()
      .isBoolean()
      .withMessage("is_friend query must be boolean."),
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

    const { search_query, is_friend } = req.query;
    const currentUserId = req.id;

    // Get user by username, first and last name.'isFriend = true' for only users who have conversation with current user
    const users = await prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        ...(search_query && {
          OR: [
            { username: { contains: search_query, mode: "insensitive" } },
            { firstname: { contains: search_query, mode: "insensitive" } },
            { lastname: { contains: search_query, mode: "insensitive" } },
          ],
        }),
        ...(is_friend && {
          AND: [
            {
              participants: {
                some: {
                  conversation: {
                    participants: {
                      some: {
                        userId: currentUserId,
                      },
                    },
                  },
                },
              },
            },
          ],
        }),
      },
      select: {
        id: true,
        username: true,
        firstname: true,
        lastname: true,
        profileUrl: true,
        bio: true,
      },
    });

    res.status(200).send(users);
  }),
];

module.exports.getOne = [
  [param("id").trim().notEmpty().withMessage("User ID cannot be empty")],
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

    const { id } = req.params;

    const user = await prisma.user.findFirst({
      where: {
        id: id,
      },
      select: {
        id: true,
        username: true,
        firstname: true,
        lastname: true,
        profileUrl: true,
        // coverUrl: true, this fucking shit just dont run fuk this.
        bio: true,
      },
    });

    res.status(200).send(user);
  }),
];

module.exports.updateOne = [
  [
    body("firstname")
      .trim()
      .notEmpty()
      .withMessage("Firstname cannot be empty"),

    body("lastname").trim().notEmpty().withMessage("Lastname cannot be empty"),

    body("username")
      .trim()
      .notEmpty()
      .withMessage("username cannot be empty")
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

    body("profileUrl").trim().optional(),

    body("bio").trim().optional(),
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

    const userId = req.userId;
    const { firstname, lastname, username, profileUrl, bio } = req.body;

    // check username uniqueness in validator
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstname && { firstname: firstname }),
        ...(lastname && { lastname: lastname }),
        ...(username && { username: username }),
        ...(profileUrl && { profileUrl: profileUrl }),
        ...(bio && { bio: bio }),
      },
      select: {
        id: true,
        username: true,
        firstname: true,
        lastname: true,
        profileUrl: true,
        bio: true,
      },
    });

    res.status(200).send(user);
  }),
];
