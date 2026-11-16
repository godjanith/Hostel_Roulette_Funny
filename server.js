require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log(err));

app.use("/api/roommates", require("./routes/roommateRoutes"));
app.use("/api/chores", require("./routes/choreRoutes"));
app.use("/api/assignments", require("./routes/assignmentRoutes"));

app.listen(process.env.PORT || 5000, () => {
    console.log("Server running on http://localhost:5000");
});