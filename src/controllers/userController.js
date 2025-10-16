const { prisma } = require("../lib/prisma");
const asyncHandler = require("express-async-handler");
const { body, query, validationResult, param } = require("express-validator");
const bcrypt = require("bcrypt");
const CustomError = require("../errors/CustomError");
const fileService = require("../services/fileService");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

attachUserImageUrls = (users) => {
  if (users?.length <= 0 || !users) return [];

  return users.map((user) => {
    if (user?.profileUrl) {
      user.profileUrl = fileService.getPublicUrl(user.profileUrl);
    }

    if (user?.coverUrl) {
      user.coverUrl = fileService.getPublicUrl(user.coverUrl);
    }

    return user;
  });
};

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
        errors.array()
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
        isActive: true,
      },
    });

    const usersWithImageUrl = attachUserImageUrls([...users]);

    res.status(200).send(usersWithImageUrl);
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
        errors.array()
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
        coverUrl: true,
        bio: true,
      },
    });

    // Convert URLs to public URLs - ADD THIS
    const userWithImageUrl = attachUserImageUrls([user])[0];

    res.status(200).send(userWithImageUrl);
  }),
];

module.exports.updateOne = [
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  [
    body("username")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Username cannot be empty")
      .custom(async (username, { req }) => {
        const currentUserId = req.id;
        const existingUser = await prisma.user.findUnique({
          where: { username },
          select: { id: true },
        });

        if (existingUser && existingUser.id !== currentUserId) {
          throw new CustomError(
            "Invalid input",
            "User with this username already exists",
            400
          );
        }
      }),

    body("firstname")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Firstname cannot be empty"),

    body("lastname")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Lastname cannot be empty"),

    body("bio").optional(),
    body("coverUrl").optional().trim(),
    body("profileUrl").optional().trim(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw new CustomError(
        "Input Error",
        "Some inputs are invalid. Please check and try again.",
        400,
        errors.array()
      );
    }

    const userId = req.id;
    const { firstname, lastname, username, bio, coverUrl, profileUrl } =
      req.body;
    const profileImageFile = req.files?.profileImage?.[0];
    const coverImageFile = req.files?.coverImage?.[0];

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profileUrl: true, coverUrl: true },
    });

    let newProfileUrl = profileUrl;
    let newCoverUrl = coverUrl;

    // Handle profile image FILE upload (if file provided)
    if (profileImageFile) {
      if (!profileImageFile.mimetype.startsWith("image/")) {
        throw new CustomError("Input Error", "Only images allowed", 400);
      }
      if (profileImageFile.size > 5 * 1024 * 1024) {
        throw new CustomError(
          "Input Error",
          "Profile image too large (max 5MB)",
          400
        );
      }

      const fileData = await fileService.uploadPublicFile(profileImageFile);
      newProfileUrl = fileData.path;

      if (user?.profileUrl) {
        try {
          await fileService.deletePublicFile(user.profileUrl);
          console.log(`Deleted old profile image: ${user.profileUrl}`);
        } catch (error) {
          console.error("Error deleting old profile image:", error);
        }
      }
    }

    // Handle cover image FILE upload (if file provided)
    if (coverImageFile) {
      if (!coverImageFile.mimetype.startsWith("image/")) {
        throw new CustomError("Input Error", "Only images allowed", 400);
      }
      if (coverImageFile.size > 5 * 1024 * 1024) {
        throw new CustomError(
          "Input Error",
          "Cover image too large (max 5MB)",
          400
        );
      }

      const fileData = await fileService.uploadPublicFile(coverImageFile);
      newCoverUrl = fileData.path;

      if (user?.coverUrl) {
        try {
          await fileService.deletePublicFile(user.coverUrl);
          console.log(`Deleted old cover image: ${user.coverUrl}`);
        } catch (error) {
          console.error("Error deleting old cover image:", error);
        }
      }
    }

    // If coverUrl provided as string and changed, delete old
    if (coverUrl && coverUrl !== user?.coverUrl && user?.coverUrl) {
      try {
        await fileService.deletePublicFile(user.coverUrl);
        console.log(`Deleted old cover image: ${user.coverUrl}`);
      } catch (error) {
        console.error("Error deleting old cover image:", error);
      }
    }

    // If profileUrl provided as string and changed, delete old
    if (profileUrl && profileUrl !== user?.profileUrl && user?.profileUrl) {
      try {
        await fileService.deletePublicFile(user.profileUrl);
        console.log(`Deleted old profile image: ${user.profileUrl}`);
      } catch (error) {
        console.error("Error deleting old profile image:", error);
      }
    }

    // Build update data
    const updateData = {};
    if (firstname !== undefined) updateData.firstname = firstname;
    if (lastname !== undefined) updateData.lastname = lastname;
    if (username !== undefined) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (newProfileUrl !== undefined) updateData.profileUrl = newProfileUrl;
    if (newCoverUrl !== undefined) updateData.coverUrl = newCoverUrl;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
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

    const userWithImageUrl = attachUserImageUrls([updatedUser])[0];

    res.status(200).send(userWithImageUrl);
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
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z\d!@#$%^&*]{8,}$/
      )
      .withMessage(
        "Password must be atleast 8 characters with letters, numbers, and a symbol"
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
            400
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
        errors.array()
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
        refreshToken: null,
      },
      select: {
        id: true,
      },
    });

    res.status(201).send({
      message: "Password changed successfully. Please log in again.",
      ...updatedUser,
    });
  }),
];
