const express = require("express");
const app = express();
const http = require("http").createServer(app);
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();
// setting cors for allowing the io module for getting message from 5001 port
const cors = require("cors");
app.use(cors());
const io = require("socket.io")(http)


const port = process.env.PORT || 5000;

// requiring express
app.use(express.json());

// getting router

// adding mongoDB
const uri = process.env.MONGO_URI;
mongoose.connect(uri, {
    useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true
}).then((data) => {
    console.log("DB is connected..");
}).catch((err) => {
    console.log(err);
});
const connection = mongoose.connection;
connection.once("open", () => {
    console.log("Database connected sucessfully");
})
const Chat = require("./models/chat.model");



// serving the staticPages of html
const staticPath = path.join(__dirname, "./Client");
app.use(express.static(staticPath));


// io.on connection 
io.on("connection", socket => {
    // after joing of the new user
    socket.on("new-user", (name) => {
        socket.broadcast.emit("user-joined", name)
        console.log(name, " has join");

        // after joing of the user we will send him/her all previous messages
        Chat.find({}, (err, data) => {
            if (err) {
                console.log(err);
            }
            else {
                console.log(data);
                socket.emit("pre-message", data);
            }
        })

    })

    // for input and output of the message
    socket.on("send-message", (data) => {
        const cUsername = data.username;
        const cMessage = data.message;
        const cTime = data.time;
        let newChat = new Chat({
            username: cUsername,
            message: cMessage,
            time: cTime
        })
        newChat.save().then((data) => {
            console.log(data);
            const props = {
                username: cUsername,
                message: cMessage,
                time: cTime
            }
            socket.emit("rec-message", props);
            socket.broadcast.emit("rec-message", props);
        }).catch((err) => {
            console.log(err);
        });
    });
    // typing event
    socket.on("typing", (username) => {
        socket.broadcast.emit("user-typing", username);
    })

})


http.listen(port || 5000, () => {
    const host = http.address().address;
    const port = http.address().port;
    console.log("Server is listening on the port no: %s and host on %s", port, host);
})