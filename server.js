const express = require("express");
const crypto = require("crypto");
const bodyParser = require("body-parser");
const cors = require("cors");


const server = express();
const PORT = 5000;

server.use(bodyParser.json());
server.use(cors({
  origin: 'https://dice-game-frontend-gamma.vercel.app', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'], 
  credentials: true, 
}));
let balance = 1000; 

const generateServerSeed = () => crypto.randomBytes(32).toString("hex");
const hashServerSeed = (seed) => crypto.createHash("sha256").update(seed).digest("hex");

let serverSeed = generateServerSeed();
let hashedServerSeed = hashServerSeed(serverSeed);

server.get("/get-hashed-seed", (req, res) => {
  res.json({ hashedServerSeed });
});

server.post("/roll-dice", (req, res) => {
  const { betAmount, clientSeed } = req.body;

  if (betAmount > balance || betAmount <= 0) {
    return res.status(400).json({ error: "Invalid bet amount" });
  }

  const combinedSeed = serverSeed + clientSeed;
  const hash = crypto.createHash("sha256").update(combinedSeed).digest("hex");
  const roll = (parseInt(hash.slice(0, 8), 16) % 6) + 1;

  if (roll >= 4) {
    balance = balance + 2*betAmount; 
  } else {
    balance -= betAmount; 
  }

  const revealedServerSeed = serverSeed;
  serverSeed = generateServerSeed(); 
  hashedServerSeed = hashServerSeed(serverSeed);

  res.json({
    roll,
    balance,
    revealedServerSeed,
  });
});

server.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
