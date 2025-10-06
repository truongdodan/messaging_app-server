const express = require("express");
const app = express();
const cors = require("cors");
const corsOptions = require("./configs/corsOptions");
const credentials = require("./middlewares/credentials");
const errorHandler = require("./middlewares/errorHandler");
const cookieParser = require("cookie-parser");
const http = require("http");
const setupSocket = require("./socket");

const server = http.createServer(app);
require("dotenv").config();
const PATH = process.env.PORT || 3000;

// Setup middlewares
app.use(credentials);
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Route - auth
app.use("/global", async (req, res) => {
  const globalConversationId = process.env.GLOBAL_CONVERSATION_ID;

  res.status(200).send({ globalConversationId });
});
app.use("/logout", require("./routes/logout"));
app.use("/refresh", require("./routes/refresh"));
app.use("/register", require("./routes/register"));
app.use("/login", require("./routes/auth"));

// Route - api
app.use(require("./middlewares/verifyJWT"));
app.use("/users", require("./routes/api/users"));
app.use("/conversations", require("./routes/api/conversations"));
app.use("/messages", require("./routes/api/messages"));

// Handle error
app.use(errorHandler);

setupSocket(server);

server.listen(PATH, () => {
  console.log(`Server is running on http://localhost:${PATH}`);
});

module.exports = app;
