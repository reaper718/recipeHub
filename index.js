const express = require('express');
const db = require('./utils/db-connection');
const path = require('path');
const cors = require('cors');

require('./models');

const app = express();

const userRouter = require('./routers/userRouter');
const recipeRouter = require('./routers/recipeRouter');
const favoriteRouter = require("./routers/favoriteRouter");
const collectionRouter = require("./routers/collectionRouter");
const reviewRouter = require("./routers/reviewRouter");
const profileRouter = require("./routers/profileRouter");
const followRouter = require('./routers/followRouter');
const feedRouter = require("./routers/feedRouter");
const adminRouter = require("./routers/adminRouter");

app.get("/", (req,res) => {
    res.sendFile(path.join(__dirname, "./public/login.html"))
})

app.use(express.static(path.join(__dirname, "./public")));
app.use(express.urlencoded({ extended: false }));
app.use(express.json())
app.use(cors());

app.use('/users', userRouter);
app.use('/recipes', recipeRouter);
app.use('/favorites', favoriteRouter);
app.use("/collections", collectionRouter);
app.use("/reviews", reviewRouter);
app.use("/profile", profileRouter);
app.use("/follows", followRouter);
app.use("/feed", feedRouter);
app.use("/admin", adminRouter);

db.sync()
    .then(() => {
        app.listen(3000, () => {
            console.log("Server is running on http://localhost:3000");
        })
    })
    .catch(err => console.log(err));