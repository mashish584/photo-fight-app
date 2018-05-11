const mongoose = require("mongoose");
const User = mongoose.model("User");
const Gallery = mongoose.model("Gallery");
const Winner = mongoose.model("Winner");

// async error handler
const { catchAsyncError } = require("../handlers/errorHandler");

//pusher handlers
const { triggerPusher } = require("../handlers/pusherHandler");

// get live competetion Polls
let getLivePoll = () => {
    return Gallery.find({
        inCompetetion: true
    });
};

/*========================
   USER GET CONTROLLERS
=========================*/

/*
  >=> Get user id
*/

exports.getId = (req, res, next) => {
    return res.status(200).json({
        user: req.session.userId
    });
};

/*
  >=> Get livePoll data
*/

exports.getLivePoll = async (req, res, next) => {
    let pollData = await getLivePoll();
    return res.status(200).json({
        message: "Live Poll Data Fetched",
        pollData
    });
};

/*
  >=> Render home view with
  >=> with essential data
*/
exports.renderHome = async (req, res, next) => {
    let images = await getLivePoll();
    images = Object.is(null, images) ? [] : images;
    return res.render("home", {
        title: "Home",
        showUpload: true,
        images
    });
};

/*
  >=> Render profile view with
  >=> with essential data
*/
exports.renderProfile = async (req, res, next) => {
    let { user } = req.session;
    user.gallery = Object.is(null, user.gallery) ? [] : user.gallery;
    return res.render("profile", {
        title: user.fullname,
        user,
        showUpload: false
    });
};

/*
  >=> Render admin view with
  >=> with essential data
*/
exports.renderAdmin = async (req, res, next) => {
    let gallery = await Gallery.find({});
    let livePoll = await getLivePoll();
    livePoll = livePoll.length > 0 ? true : false;
    return res.render("admin", {
        title: "Admin",
        gallery,
        showUpload: false,
        livePoll
    });
};

/*
  >=> Render winner view with
  >=> with essential data
*/
exports.renderWinners = async (req, res, next) => {
    let winners = await Winner.find({});
    return res.render("winners", {
        title: "Winners",
        showUpload: false,
        winners
    });
};

/*==========================
   USER POST CONTROLLERS
===========================*/

/*
    >=> Function to upload valid image
    >=> on cloudinary server
*/
exports.uploadPhoto = (req, res, next) => {
    //get file
    let { file } = req;

    //throw error message if
    //file type is invalid
    if (!file || !file.mimetype.startsWith("image")) {
        return res.status(415).json({
            message: "Please upload image file"
        });
    }

    //cloudinary configuration
    const cloudinary = require("cloudinary");
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    // cloudinary method to upload image
    // via buffer
    cloudinary.uploader
        .upload_stream(
            catchAsyncError(async result => {
                let body = {
                    image: result.secure_url,
                    user: req.session.userId
                };
                let image = await new Gallery(body).save();
                // update session data
                req.session.user.gallery.unshift(image);
                return res.status(200).json({
                    image,
                    message: "Image uploaded."
                });
            })
        )
        .end(file.buffer);
};

/*
    >=> Function to add vote
    >=> of user for target image
*/
exports.addVote = async (req, res, next) => {
    let { userId } = req.session;
    let { image } = req.body;

    // A simple check to see if user
    // have already voted or not
    let count = await Gallery.count({
        $and: [
            {
                inCompetetion: true
            },
            {
                votes: {
                    $in: [userId]
                }
            }
        ]
    });

    // if count is 0 than add the user vote for
    // target image
    if (count === 0) {
        let result = await Gallery.findOneAndUpdate(
            {
                _id: image
            },
            {
                $push: {
                    votes: userId
                }
            },
            {
                new: true
            }
        ).exec();

        // Trigger the message over admin-channel,
        // home-channel & user-channel
        triggerPusher("admin-channel", "update-chart", {
            id: result._id,
            votes: result.votes.length,
            user: result.user.fullname
        });
        triggerPusher("home-channel", "update-count", {
            votes: result.votes.length,
            image: result._id
        });
        triggerPusher(`user-${result.user._id}`, "notify", {
            message: "You receive 1 vote.",
            path: false,
            reload: false
        });

        return res.status(200).json({
            count: result.votes.length
        });
    } else {
        return res.status(200).json({
            message: "Can't vote more than once"
        });
    }
};

/*
    >=> Function to stop ongoing
    >=> Poll and declare winner
*/
exports.stopCompetetion = async (req, res, next) => {
    let results = await Gallery.find({
        inCompetetion: true
    }).sort({
        votes: -1
    });

    // update the documents where incompetetion
    // is true to its initial state
    await Gallery.updateMany(
        {
            inCompetetion: true
        },
        {
            $set: {
                inCompetetion: false,
                votes: []
            }
        }
    ).exec();

    //create win and tie result object and
    //post it to new winners schema
    let data =
        results[0].votes.length === results[1].votes.length
            ? {
                  winner: "-",
                  competitor: `${results[0].user.fullname}:${results[1].user.fullname}`,
                  points: `${results[0].votes.length}-${results[1].votes.length}`,
                  image: "-"
              }
            : {
                  winner: results[0].user.fullname,
                  competitor: results[1].user.fullname,
                  points: `${results[0].votes.length}-${results[1].votes.length}`,
                  image: results[0].image
              };

    await new Winner(data).save();

    // notify both competetiors for live poll end
    results.map((img, index) => {
        let { user } = img;
        let data;

        if (results[0].votes.length != results[1].votes.length) {
            if (index === 0) {
                data = {
                    message: `Congatulations! You beat ${results[1].user.fullname} by ${img.votes.length -
                        results[1].votes.length} points`,
                    path: "winners"
                };
            } else {
                data = {
                    message: `Hard Luck ! ${results[0].user.fullname} beat you by ${results[0].votes.length -
                        img.votes.length} points`,
                    path: "winners"
                };
            }
        } else {
            data = {
                message: "Competition Finshed. (Result: Tie)",
                path: "winners"
            };
        }

        triggerPusher(`user-${user._id}`, "notify", data);
    });

    return res.json({
        message: "Success"
    });
};

/*=========================
   USER PUT CONTROLLER
===========================*/

/*
    >=> Function to start live
    >=> Poll b/w two selected images
*/

exports.startCompetetion = async (req, res, next) => {
    //making no competetion is going on
    let count = await Gallery.count({
        inCompetetion: true
    });

    // if count is 0 update the both competeImages
    // by setting inCompetetion to true
    if (count === 0) {
        await Gallery.updateMany(
            {
                $or: [
                    {
                        _id: req.body.competeImages[0]
                    },
                    {
                        _id: req.body.competeImages[1]
                    }
                ]
            },
            {
                $set: {
                    inCompetetion: true
                }
            }
        ).exec();

        //get the updated images details
        let images = await getLivePoll();

        // notify owner of compete images for
        // live poll
        images.map(img => {
            let { user } = img;
            triggerPusher(`user-${user._id}`, "notify", {
                message: "Your photo is live for competetion.",
                path: "home"
            });
        });

        return res.status(200).json({
            message: "Live Poll Begins.",
            images
        });
    }
};
