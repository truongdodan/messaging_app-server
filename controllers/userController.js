const prisma = require("../lib/prisma");
const asyncHandler = require("express-async-handler");
const { body, query } = require("express-validator");
const bcrypt = require("bcrypt");

module.exports.getAny = [
  [],
  asyncHandler(async (req, res) => {
    const { search_query, is_friend } = req.query;
    const currentUserId = req.userId;

    // Get user by username, first and last name.'isFriend = true' for only users who have conversation with current user
    const users = await prisma.user.findMany({
      where: {
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
            { id: { not: currentUserId } },
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
  [],
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: {
        id: id,
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

module.exports.createOne = [
  [],
  asyncHandler(async (req, res) => {
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
        username: true,
      },
    });

    res.status(201).send(newUser);
  }),
];

module.exports.updateOne = [
  [],
  asyncHandler(async (req, res) => {
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
