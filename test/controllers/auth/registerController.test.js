const app = require("../../../src/index");
const request = require("supertest");
const prisma = require("../../../src/lib/prisma");

describe("POST /register should create new account for user", () => {
  beforeAll(async () => {
    await prisma.user.deleteMany({});
  });

  const userData = {
    email: "dodantruong04@gmail.com",
    firstname: "truong",
    lastname: "dodan",
    username: "tRuongdo",
    password: "Strongp@ssword123",
    confirmedPassword: "Strongp@ssword123",
  };

  // this would fail every time running cuz the current user data have already been created, please fill new user
  test("Should return 201 status code on success", async () => {
    const response = await request(app)
      .post("/register")
      .send(userData)
      .expect(201);
  });

  test("Should reject username already exists", async () => {
    const response = await request(app)
      .post("/register")
      .send({
        ...userData,
        username: "tRuongdo",
      })
      .expect(400);

    console.log("HEEREEEEEEEEEEEEEEEEEEEE");
    console.log(response.body.error.details);

    const nameError = response.body.error.details.find(
      (err) => err.path === "username",
    );

    expect(nameError.msg).toContain("User with this username already exists");
  });

  test("Should reject email already exists", async () => {
    const response = await request(app)
      .post("/register")
      .send({
        ...userData,
        email: "dodantruong04@gmail.com",
      })
      .expect(400);

    const emailError = response.body.error.details.find(
      (err) => err.path === "email",
    );

    expect(emailError.msg).toContain("This email already been register");
  });

  test("Should reject invalid password", async () => {
    const response = await request(app)
      .post("/register")
      .send({
        ...userData,
        password: "abc123",
        confirmedPassword: "abc123",
      })
      .expect(400);

    const passwordError = response.body.error.details.find(
      (err) => err.path === "password",
    );

    expect(passwordError.msg).toContain(
      "Password must be atleast 8 characters with letters, numbers, and a symbol",
    );
  });
});
