const express = require("express");
const cors = require("cors");
require("dotenv").config();

const chatRoutes = require("./routes/chat");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.json({
        status: "OK"
    });
});

app.use("/api/chat", chatRoutes);

const port = process.env.PORT || 3001;

app.listen(port, "0.0.0.0", () => {
    console.log(`Server is running on port ${port}`);
});
