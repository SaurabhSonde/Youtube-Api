require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const youtubeRoutes = require("./routes/upload");

const app = express();
mongoose
  .connect(process.env.Mongo_Uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Database Connected....");
  })
  .catch((err) => {
    console.log(err);
  });

// middlewares
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());
app.use(express.json());
// routes
app.use("/", youtubeRoutes);

app.listen(5000, () => {
  console.log("Server in running on port 5000🚀");
});
