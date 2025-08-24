const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const emailRoutes = require("./routes/email.routes");

dotenv.config();

const app = express();
app.use(bodyParser.json({ limit: "5mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB Connect
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/lucid_email", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err));

// Root route
app.get("/", (req, res) => {
  res.send("Lucid Email API is running!");
});

app.use("/", emailRoutes);

module.exports = app;
