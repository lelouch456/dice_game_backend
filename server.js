const express = require("express");
const crypto = require("crypto");
const bodyParser = require("body-parser");
const cors = require("cors");

const server = express();
const PORT = 5000;

server.use(bodyParser.json());
server.use(cors());

let balance = 1000; 

// Provably Fair: Generate a server seed and hash
const generateServerSeed = () => crypto.randomBytes(32).toString("hex");
const hashServerSeed = (seed) => crypto.createHash("sha256").update(seed).digest("hex");

let serverSeed = generateServerSeed();
let hashedServerSeed = hashServerSeed(serverSeed);

// Endpoint to get the hashed server seed
server.get("/get-hashed-seed", (req, res) => {
  res.json({ hashedServerSeed });
});

// Endpoint to roll the dice
server.post("/roll-dice", (req, res) => {
  const { betAmount, clientSeed } = req.body;

  if (betAmount > balance || betAmount <= 0) {
    return res.status(400).json({ error: "Invalid bet amount" });
  }

  // Generate a random roll (1-6) using server seed and client seed
  const combinedSeed = serverSeed + clientSeed;
  const hash = crypto.createHash("sha256").update(combinedSeed).digest("hex");
  const roll = (parseInt(hash.slice(0, 8), 16) % 6) + 1;

  // Update balance based on the roll
  if (roll >= 4) {
    balance = balance + 2*betAmount; // Player wins (2x payout)
  } else {
    balance -= betAmount; // Player loses
  }

  // Reveal the server seed for verification
  const revealedServerSeed = serverSeed;
  serverSeed = generateServerSeed(); // Generate a new server seed for the next round
  hashedServerSeed = hashServerSeed(serverSeed);

  res.json({
    roll,
    balance,
    revealedServerSeed,
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});