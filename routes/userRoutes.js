const express = require("express");
const multer = require("multer");
const router = express.Router();

// multer configuration
let upload = multer({
    storage: multer.memoryStorage()
});

// controllers
const {
    renderHome,
    renderProfile,
    renderAdmin,
    renderWinners,
    uploadPhoto,
    startCompetetion,
    stopCompetetion,
    addVote,
    getLivePoll,
    getId
} = require("../controllers/userController");

//async error handler
const { catchAsyncError } = require("../handlers/errorHandler");

//guards
const { isLoggedIn, isAdmin, authorizeUser, isUser } = require("../handlers/routeGuard");

/*
    => User GET Routes
*/

router.get("", renderHome);

router.get("/home", renderHome);

router.get("/profile", isLoggedIn, renderProfile);

router.get("/admin", isLoggedIn, isAdmin, catchAsyncError(renderAdmin));

router.get("/winners", renderWinners);

// get live poll data and current user id
router.get("/api/livePoll", catchAsyncError(getLivePoll));
router.get("/api/getId", getId);

/*
   => User POST routes
*/

router.post("/upload", isUser, upload.single("upload"), uploadPhoto);
router.post("/vote", isUser, catchAsyncError(addVote));
router.post("/admin/competetion/stop", isLoggedIn, isAdmin, catchAsyncError(stopCompetetion));

/*
  => User PUT routes
*/

router.put("/admin/competetion/start", authorizeUser, catchAsyncError(startCompetetion));

module.exports = router;
