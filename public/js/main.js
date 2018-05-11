const chartContainer = document.querySelector("#chartContainer");
const uploadBtn = document.querySelector("#upload");

// Layer Button to add or remove images
// from competetion
const competeButtons = document.querySelectorAll("#compete");

// Button container to store poll Start and poll Stop button
const buttonContainer = document.querySelector("#buttonContainer");
const pollStart = document.querySelector(".btn-start");
const pollEnd = document.querySelector(".btn-end");

// Home Vote Button
const voteButtons = document.querySelectorAll(".btn-vote");

// store selected images
let competeImages = [];

// canvas JS chart config and declaration
let chart;
let dataPoints = [
    {
        label: "User 1",
        y: 0
    },
    {
        label: "User 2",
        y: 0
    }
];

// initializing pusher API
const pusher = new Pusher("5a2a7859d0010b12e72c", {
    cluster: "ap2"
});

/*
   >=> create chart if chartContainer
   >=> is available in DOM
*/
if (chartContainer) {
    // pusher subscription for admin channel
    let AdminChannel = pusher.subscribe("admin-channel");

    //Listening for 'update-chart' event on pusher admin channel
    AdminChannel.bind("update-chart", data => {
        dataPoints.map((point, index) => {
            // if labelname is equal to username update the
            // y-axis point
            if (point.label === `${data.user}-${data.id}`) {
                point.y = data.votes;
            }
        });
        //render chart with update
        chart.render();
    });

    //creating new chart instance
    chart = new CanvasJS.Chart("chartContainer", {
        animationEnabled: true,
        title: {
            text: "Live Competetion Poll"
        },
        data: [
            {
                type: "column",
                dataPoints
            }
        ]
    });

    //render chart once chart instance created
    chart.render();
    //fetching livePoll data for chart from server
    updataDataPoints();
}

/*
   >=> Add event listener on uploadBtn
   >=> if it is available in DOM
*/

if (uploadBtn) uploadBtn.addEventListener("change", uploadImage);

/*
   >=> Add event listener on competeButtons
   >=> if it is available in DOM
*/

if (competeButtons.length > 0) {
    competeButtons.forEach(compete => {
        compete.addEventListener("click", function() {
            let isCancel = this.classList.contains("danger");
            // Incase of cancel pull the image out
            // from competeImages array else push it
            isCancel ? removeFromCompetetion.call(this) : addForCompetetion.call(this);
        });
    });
}

/*
   >=> Add event listener on buttonContainer
   >=> if it is available in DOM & use
   >=> event propogation for targeting
   >=> specific element
*/

if (buttonContainer) {
    buttonContainer.addEventListener("click", e => {
        let { target } = e;
        if (target.classList.contains("btn-start")) startLivePoll();
        if (target.classList.contains("btn-end")) stopLivePoll();
    });
}

/*
   >=> Add event listener on voteButons
   >=> if it is available in DOM & also
   >=> subscribe to pusher home channel
*/

if (voteButtons.length > 0) {
    //subscribing to pusher home-channel
    let homeChannel = pusher.subscribe("home-channel");
    // update live vote count
    homeChannel.bind("update-count", data => {
        Array.from(voteButtons).map(button => {
            if (button.dataset.image === data.image) {
                let container = button.parentElement.querySelector(".votes");
                container.innerHTML = `<i class="fa fa-user-o"></i> ${data.votes}`;
            }
        });
    });

    voteButtons.forEach(button => {
        button.addEventListener("click", function() {
            //get imageId from dataset
            let { image } = this.dataset;

            // disable all votes button
            voteButtons.forEach(button => {
                button.setAttribute("disabled", true);
                button.style.opacity = "0.5";
            });

            // making a post request to '/vote'
            // with imageId
            axios
                .post("/vote", { image })
                .then(res => {
                    let { count, message } = res.data;

                    //log the response
                    if (message) {
                        console.error(message);
                    } else {
                        console.log(res);
                    }

                    // enable all votes button
                    voteButtons.forEach(button => {
                        button.removeAttribute("disabled");
                        button.style.opacity = "1";
                    });
                })
                .catch(err => {
                    console.log(err);
                    // enable all votes button
                    voteButtons.forEach(button => {
                        button.removeAttribute("disabled");
                        button.style.opacity = "1";
                    });
                });
        });
    });
}

/*
 >=> get the channel id for current user
*/

getUserChannelId();

/*==========================
  > Function Declarations <
============================*/

/*
    >=> Function to fetch user id from
    >=> from server for subscribing
    >=> user channel
*/
function getUserChannelId() {
    axios.get("/api/getId").then(res => {
        let id = res.data.user || 0;
        let UserChannel = pusher.subscribe(`user-${id}`);
        UserChannel.bind("notify", data => {
            let { message, path, reload } = data;
            let flash = document.querySelector(".notification-flash");
            flash.innerHTML = message;
            flash.classList.add("show");

            //hide flash and update page location
            setTimeout(() => {
                flash.classList.remove("show");
                if (path) location.href = `${path}`;
            }, 5000);
        });
    });
}

/*
    >=> Function to fetch poll points
    >=> of ongoing competetion for updating
    >=> chart dataPoints
*/
function updataDataPoints() {
    axios
        .get("/api/livePoll")
        .then(res => {
            let { pollData, message } = res.data;

            if (pollData.length > 0) {
                // update dataPoints and render Chart
                dataPoints.map((point, index) => {
                    point.label = `${pollData[index].user.fullname}-${pollData[index]._id}`;
                    point.y = pollData[index].votes.length;
                });
                // render chart when data received
                chart.render();
            }
        })
        .catch(err => console.log(err));
}

/*
    >=> Function to start live poll
    >=> when length of competeImages
    >=> array is equal to 2
*/
function startLivePoll() {
    if (competeImages.length === 2) {
        axios
            .put("/admin/competetion/start", {
                competeImages
            })
            .then(res => {
                let { images } = res.data;

                // hide all images layer when poll started
                let layers = Array.from(document.querySelectorAll(".layer"));
                layers.map(layer => layer.remove());

                // remove start button
                pollStart.remove();

                // add Stop button
                buttonContainer.innerHTML = `<button class="btn-end danger">Stop Live Poll</button>`;

                // update dataPoints and render Chart again
                dataPoints.map((point, index) => {
                    point.label = `${images[index].user.fullname}-${images[index]._id}`;
                    point.y = images[index].votes.length;
                });
                chart.render();
            })
            .catch(err => console.error(err));
    } else {
        alert("2 images are required to compete");
    }
}

/*
    >=> Function to stop live poll
*/
function stopLivePoll() {
    axios.post("/admin/competetion/stop").then(res => {
        location.reload();
    });
}

/*
    >=> Function for pushing images
    >=> in competeImages array
*/
function addForCompetetion() {
    let layer = this.parentElement;
    let galleryItem = layer.parentElement;
    let { image } = this.dataset;

    // add Image in competeImages array
    if (competeImages.length < 2) {
        competeImages.push(image);
        // add selected class on .layer
        layer.classList.add("selected");
        // enable live poll button
        competeImages.length === 2 ? pollStart.removeAttribute("disabled") : false;
        // update button style and text
        this.innerText = "Remove Image From Competetion";
        this.classList.add("danger");
    } else {
        alert("Maximum 2 images allowed for competetion");
    }
}

/*
    >=> Function for popping images
    >=> out from the competeImages array
*/
function removeFromCompetetion() {
    let layer = this.parentElement;
    let galleryItem = layer.parentElement;
    let { image } = this.dataset;

    // remove image from competeImages array
    competeImages.splice(competeImages.indexOf(image), 1);
    // remove selected class from .layer
    layer.classList.remove("selected");
    // disable live poll button
    pollStart.setAttribute("disabled", true);
    // set the button to it's initial state
    this.innerText = "Select Image For Competetion";
    this.classList.remove("danger");
}

/*
  >=> Upload Handler function for uploading image
  >=> on cloudinart through node.js server by using
  >=> axios package
*/
function uploadImage() {
    // get upload files and disable
    // input type files
    let { files } = this;
    this.disabled = true;

    // if files length is greater than 0
    // upload file else show alert with message
    if (files.length > 0) {
        let formData = new FormData();
        let progress = document.querySelector(".progress");
        let loadText = document.querySelector(".load-text");
        formData.append("upload", files[0]);

        //POST request to '/upload' for uploading
        // image on cloudinary
        axios({
            url: "/upload",
            method: "POST",
            data: formData,
            // tracking upload progress
            onUploadProgress: function(progressEvent) {
                let percentage = Math.floor(progressEvent.loaded / progressEvent.total) * 100;
                progress.style.width = `${percentage}%`;
                loadText.innerText = `${percentage}%`;
                if (percentage === 100) {
                    loadText.innerText = "Upload Completed.Waiting for response...";
                }
            }
        })
            .then(res => {
                let { data } = res;
                loadText.innerText = "Done";
                setTimeout(() => {
                    // reset all upload styles back to
                    // initial state
                    loadText.innerText = "0%";
                    progress.style.width = "0%";
                    this.disabled = false;
                }, 500);
            })
            .catch(error => {
                // reset all upload styles back to
                // initial state
                loadText.innerText = "Try Again";
                progress.style.width = "0%";
                this.disabled = false;
            });
    } else {
        alert("Please Upload file");
        this.disabled = false;
    }
}
