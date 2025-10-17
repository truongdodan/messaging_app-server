const bcrypt = require("bcrypt");

async function hashPassword(password) {
  const hash = await bcrypt.hash(password, 10);
  console.log("Hashed password:", hash);
}

// Change 'admin123' to whatever password you want
hashPassword("Strongp@ssword123");
