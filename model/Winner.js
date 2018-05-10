const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const WinnerSchema = new mongoose.Schema({
    winner: String,
    competitor: String,
    points: String,
    image: String
});

module.exports = mongoose.model("Winner", WinnerSchema);
