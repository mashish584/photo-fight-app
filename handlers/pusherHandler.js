const Pusher = require("pusher");

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: "ap2",
    encrypted: true
});

exports.triggerPusher = (channel, event, data) => {
    return pusher.trigger(channel, event, data);
};
