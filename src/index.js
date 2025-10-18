const express = require("express");
const app = express();
const cors = require("cors");
const corsOptions = require("./configs/corsOptions");
const credentials = require("./middlewares/credentials");
const errorHandler = require("./middlewares/errorHandler");
const cookieParser = require("cookie-parser");
const http = require("http");
const setupSocket = require("./socket");
const socketEmitter = require("./utils/socketEmitter");

require("dotenv").config();
const server = http.createServer(app);
const PATH = process.env.PORT || 3000;

// Setup middlewares
app.use(credentials);
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Route - auth
app.use("/global", async (req, res) =>
  res
    .status(200)
    .send({ globalConversationId: process.env.GLOBAL_CONVERSATION_ID })
);
app.use("/logout", require("./routes/logout"));
app.use("/refresh", require("./routes/refresh"));
app.use("/register", require("./routes/register"));
app.use("/login", require("./routes/auth"));

// Route - api
app.use(require("./middlewares/verifyJWT"));
app.use("/users", require("./routes/api/userRoute"));
app.use("/conversations", require("./routes/api/conversationRoute"));
app.use("/messages", require("./routes/api/messageRoute"));
app.use("/files", require("./routes/api/fileRoute"));

// Handle error
app.use(errorHandler);

const io = setupSocket(server);
socketEmitter.setIO(io);

server.listen(PATH, () => {
  console.log(
    `Server is running on https://messaging-app-server-8fox.onrender.com:${PATH}`
  );
});

module.exports = app;
