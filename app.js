const express = require("express");
const youtubeRoutes = require("./routes/upload");

const app = express();

// routes
app.use("/api", youtubeRoutes);

app.listen(5000, () => {
  console.log("Server in running on port 5000🚀");
});
