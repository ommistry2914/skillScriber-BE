const express = require("express");

const app = express();

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));


app.get("/", (req, res) => {
  res.send("skillScribe API is up and running!");
});
app.get("/health", (req, res) => {
  res.send("skillScribe API is up and running!");
});

module.exports = app;
