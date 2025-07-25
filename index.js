const express = require("express");
const app = express();
const cors = require("cors");
const corsOptions = require("./configs/corsOptions");
const credentials = require("./middlewares/credentials");
const errorHandler = require("./middlewares/errorHandler");

const PATH = process.env.PORT || 3000;
require("dotenv").config();

// Setup middlewares
app.use(credentials);
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle error
app.use(errorHandler);

// Route
app.use("/users", require("./routes/api/users"));
app.use("/conversations", require("./routes/api/conversations"));
app.use("/messages", require("./routes/api/messages"));

app.listen(PATH, () => {
  console.log(`Server is running on port ${PATH}`);
});

const { PrismaClient } = require("./generated/prisma");
const prisma = new PrismaClient();
const main = async () => {
  /* const result = await prisma.user.createMany({
    data: [
        {
            id: 'cmd8dsnsh0000xgdka1vum2ht',
            email: 'truong@gmail.com',
            password: 'password123',
            firstname: 'tRuong',
            lastname: 'dodan',
            username: '@tRuongdodan',
            profileUrl: null,
        },
      {
        email: "tratt@gmail.com",
        password: "password123",
        firstname: "tra",
        lastname: "dh",
        username: "@tra",
        bio: "Hello there",
      },
      {
        email: "cctran@gmail.com",
        password: "password123",
        firstname: "chung",
        lastname: "trant",
        username: "@ttchung",
        bio: "Hello there",
      },
      {
        email: "trang@gmail.com",
        password: "password123",
        firstname: "thu",
        lastname: "ngoth",
        username: "@trangtngo",
        bio: "Hello there",
      },
      {
        email: "trung@gmail.com",
        password: "password123",
        firstname: "trung",
        lastname: "vovan",
        username: "@vvtrung",
        bio: "Hello there",
      },
      {
        email: "oanh@gmail.com",
        password: "password123",
        firstname: "oanh",
        lastname: "tac",
        username: "@oangh",
        bio: "Hello there",
      },
      {
        email: "tritt@gmail.com",
        password: "password123",
        firstname: "tri",
        lastname: "tranvan",
        username: "@tri",
        bio: "Hello there",
      },
      {
        email: "hoa@gmail.com",
        password: "password123",
        firstname: "hoa",
        lastname: "hong",
        username: "@hoahong",
        bio: "Hello there",
      },
    ],
  }); */
  /* const result = await prisma.message.createMany({
    data: [
      {
        content: "Hello there",
        senderId: "cmd8dsnsh0000xgdka1vum2ht",
        conversationId: "cmddx7jg00000xgw00r5t8d2b",
      },
      {
        content: "You there?",
        senderId: "cmd8dsnsh0000xgdka1vum2ht",
        conversationId: "cmddx7jg00000xgw00r5t8d2b",
      },
      {
        content: "It's me, please answer",
        senderId: "cmd8dsnsh0000xgdka1vum2ht",
        conversationId: "cmddx7jg00000xgw00r5t8d2b",
      },
      {
        content: "I need 10grands rn",
        senderId: "cmd8dsnsh0000xgdka1vum2ht",
        conversationId: "cmddx7jg00000xgw00r5t8d2b",
      },
    ],
  }); */
  /* const result = await prisma.conversation.create({
    data: {
      type: "GROUP",
      creator: {
        connect: { id: "cmd8dsnsh0000xgdka1vum2ht" },
      },
      participants: {
        create: [
          {
            user: { connect: { id: "cmd8dsnsh0000xgdka1vum2ht" } },
          },
          {
            user: { connect: { id: "cmd9l6dbz0001xgsovdd2tqhx" } },
          },
          {
            user: { connect: { id: "cmd9l6dbz0005xgsozud5nrtl" } },
          },
        ],
      },
    },
  }); */

  // console.log(await prisma.user.findMany());
  /* console.log(
    await prisma.conversation.findMany({
      include: {
        participants: {
          include: {
            user: {
              select: {
                username: true,
              }
            }
          }
        },
      },
    }),
  ); */
  // console.log(await prisma.message.findMany());
  // console.log(await prisma.message.findMany());
  // console.log(await prisma.participant.findMany());
  // console.log(await prisma.message.findMany());
  // console.log(result);
  /* console.log(
    await prisma.conversation.delete({
      where: {
        id: "cmdea9z0z0000xgj0gmj900e3",
      },
    }),
  ); */

  /* const userId = "cmd8dsnsh0000xgdka1vum2ht";
  const receiverId = "cmd9l6dbz0002xgsoy7xazhez";
  const conversationId = "";
  const content = "lo trangggggggg";

  const message = await prisma.$transaction(async (tx) => {
    // make sure conversation exists, else create new one
    const conversation = await tx.conversation.upsert({
      where: { id: conversationId },
      update: {},
      create: {
        creator: { connect: { id: userId } },
        participants: {
          create: [
            { user: { connect: { id: userId } } },
            { user: { connect: { id: receiverId } } },
          ],
        },
      },
    });

    return await tx.message.create({
      data: {
        type: "TEXT",
        content: content,
        sender: { connect: { id: userId } },
        conversation: { connect: { id: conversation.id } },
      },
      select: {
        id: true,
      },
    });
  }); */

  console.log("\n\n");
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
