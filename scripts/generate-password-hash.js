const bcrypt = require("bcryptjs");

const password = process.argv[2];

if (!password) {
  console.error("Usage: node scripts/generate-password-hash.js <password>");
  process.exit(1);
}

bcrypt.hash(password, 12).then((hash) => {
  console.log("Password hash:", hash);
  console.log("\nAdd this to your .env.local file:");
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
});