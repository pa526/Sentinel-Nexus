const express = require("express");
const app = express();
const mongoose = require("mongoose");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const Reading = require("./models/reading");
const Device = require("./models/device");
const path = require("path");
const User = require("./models/user");
const session = require("express-session");
const passport = require("passport");

let mongoUrl = 'mongodb://127.0.0.1:27017/sentinelNexus';

main()
.then((res) => {
    console.log("connected succesfully");
})
.catch(err => console.log(err));

async function main() {
  await mongoose.connect(mongoUrl);
};

// middleware
app.use(cors());
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 hours
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const { requireAuth } = require("./middleware/auth");

// Routers
const authRouter = require("./routes/auth");
const readingsRouter = require("./routes/readings");
const pagesRouter = require("./routes/pages");
const samplesRouter = require("./routes/samples");
const aiRouter = require("./routes/ai");

app.use("/", pagesRouter);
app.use("/", authRouter);
app.use("/api/readings", readingsRouter);
app.use("/api/sample", samplesRouter);
app.use("/", aiRouter);


// socket.io server
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

io.on("connection", (socket) => {
    // client connected
});

server.listen(3000, () => {
    console.log("app is listening on port 3000");
});

// expose io to routers
app.set('io', io);