const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");

router.get("/login", (req, res) => {
    res.render("login", { error: null });
});

router.get("/register", (req, res) => {
    res.render("register", { error: null });
});

router.post("/register", async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ message: "username and password required" });
        const user = new User({ username });
        await User.register(user, password);
        req.login(user, (err) => {
            if (err) return res.status(500).json({ message: "registration succeeded, login failed" });
            return res.json({ ok: true });
        });
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: err && err.message ? err.message : "registration failed" });
    }
});

router.post("/login", passport.authenticate("local"), (req, res) => {
    return res.json({ ok: true });
});

router.post("/logout", (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.json({ ok: true });
    });
});

module.exports = router;







