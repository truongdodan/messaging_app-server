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
      .withMessage("Username cannot be empty")
      .custom(async (username, { req, res }) => {
        const currentUserId = req.id;

        const existingUser = await prisma.user.findUnique({
          where: {
            username: username,
          },
          select: {
            id: true,
          },
        });

        if (existingUser && existingUser?.id !== currentUserId) {
          throw new CustomError(
            "Invalid input",
            "User with this username already exists",
            400,
          );
        }
      }),

    body("profileUrl").trim().optional(),

    body("coverUrl").trim().optional(),

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

    const userId = req.id;
    const { firstname, lastname, username, profileUrl, bio, coverUrl } =
      req.body;

    // Get old user data to check for old profileUrl
    const oldUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { profileUrl: true, coverUrl: true },
    });

    const isValidUrl = (value) => {
      try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:";
      } catch {
        return false;
      }
    };

    // Delete old profile image if new one is provided
    if (profileUrl && oldUser?.profileUrl && !isValidUrl(oldUser.profileUrl)) {
      try {
        await supabase.storage.from("chat-files").remove([oldUser.profileUrl]);

        console.log(`Deleted old profile image: ${oldUser.profileUrl}`);
      } catch (error) {
        console.error("Error deleting old profile image:", error);
        // Don't fail the update if delete fails - just log it
      }
    }

    if (coverUrl && oldUser?.coverUrl && !isValidUrl(oldUser.coverUrl)) {
      try {
        await supabase.storage.from("chat-files").remove([oldUser.coverUrl]);
        console.log(`Deleted old cover image: ${oldUser.coverUrl}`);
      } catch (error) {
        console.error("Error deleting old cover image:", error);
      }
    }

    // check username uniqueness in validator
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstname && { firstname }),
        ...(lastname && { lastname }),
        ...(username && { username }),
        ...(profileUrl && { profileUrl }),
        ...(coverUrl && { coverUrl }),
        ...(bio && { bio }),
      },
      select: {
        id: true,
        username: true,
        firstname: true,
        lastname: true,
        profileUrl: true,
        coverUrl: true,
        bio: true,
      },
    });

    res.status(200).send(user);
  }),
];

module.exports.changePassword = [
  [
    body("oldPassword")
      .trim()
      .notEmpty()
      .withMessage("Old password cannot be empty"),

    body("newPassword")
      .trim()
      .notEmpty()
      .withMessage("Newpassword cannot be empty")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z\d!@#$%^&*]{8,}$/,
      )
      .withMessage(
        "Password must be atleast 8 characters with letters, numbers, and a symbol",
      ),

    body("confirmNewPassword")
      .trim()
      .notEmpty()
      .withMessage("Confirmed password cannot empty")
      .custom(async (confirmedPassword, { req }) => {
        const { newPassword, confirmNewPassword } = req.body;

        if (confirmNewPassword !== newPassword) {
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

    const { oldPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: {
        id: req.id,
      },
    });

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      throw new CustomError("Invalid credentials", "Wrong old password", 400);
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const updatedUser = await prisma.user.update({
      where: { id: req.id },
      data: {
        password: hashedPassword,
      },
      select: {
        id: true,
      },
    });

    res.status(201).send(updatedUser);
  }),
];
