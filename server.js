const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

require("dotenv").config({ path: "secret.env" });

mongoose
    .connect(process.env.DATABASE)
    .then(() => {
        // import models
        require("./model/User");
        require("./model/Image");
        require("./model/Winner");

        const app = require("./app");
        app.set("port", process.env.PORT || 4040);
        app.listen(app.get("port"), () => console.log(`Server is running on port ${app.get("port")}`));
    })
    .catch(err => console.log(err));
