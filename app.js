const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const youtubeRoutes = require("./routes/upload");

const app = express();
// middlewares
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());
app.use(express.json({ extented: false }));
// routes
app.use("/", youtubeRoutes);

app.listen(5000, () => {
  console.log("Server in running on port 5000🚀");
});
