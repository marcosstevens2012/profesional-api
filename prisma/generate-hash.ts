import * as bcrypt from "@node-rs/bcrypt";

async function generateHash() {
  const password = "test123";
  const hash = await bcrypt.hash(password, 10);
  console.log("Password:", password);
  console.log("Hash:", hash);

  // Test the hash
  const isValid = await bcrypt.compare(password, hash);
  console.log("Hash validates:", isValid);
}

generateHash().catch(console.error);
