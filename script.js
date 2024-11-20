const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const https = require("https");
const date = require(__dirname + "/date.js");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const path = require("path");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const userRouter = require("./routes/user.route.js");
const PORT = process.env.PORT;

const MONGO_DB = process.env.mongodb + "weatherApp";;

main().then(() => {
    console.log(`connected to db`);
}).catch((e) => {
    console.log(e);
});

async function main() {
    await mongoose.connect(MONGO_DB);
}

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    // User is not authenticated, redirect to login page or handle as needed
    res.redirect("/login");
};

// Templating
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

const imgurl = "https://cdn.iconscout.com/icon/free/png-256/sunny-weather-1-458138.png";


let temp = "";
let todaydate = date.getDate();
let weatherDesc = "Search for Temperature";
let query = "";

const sessionOptions = {
    secret: "mysecret",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expiry: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    }
};

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(session(sessionOptions));
app.use(flash());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.crrUser = req.user;
    next();
});

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/', (req, res) => {
    res.redirect('/home');
});

app.post('/', (req, res) => {
    res.redirect('/home');
});

app.get("/home", isAuthenticated, function (req, res) {
    res.render("home/index", { temp1: temp, date1: todaydate, des: weatherDesc, place: query, img: imgurl });
});

app.post("/home", function (req, res) {
    query = req.body.cityName;

    const apikey = process.env.api_key;
    const unit = "metric";
    let url = "https://api.openweathermap.org/data/2.5/weather?q=" + query + "&appid=" + apikey + "&units=" + unit;

    https.get(url, (response) => {

        let rawData = '';
        response.on("data", (chunk) => {
            rawData += chunk;
        });
console
        response.on("end", () => {
            try {
                const weatherData = JSON.parse(rawData);
                if (weatherData && weatherData.main && weatherData.weather && weatherData.weather.length > 0) {
                    temp = weatherData.main.temp + "° C";
                    weatherDesc = weatherData.weather[0].description;
                    const icon = weatherData.weather[0].icon;
                    const imgurl = "http://openweathermap.org/img/wn/" + icon + "@2x.png";

                    res.render("home/index", { temp1: temp, date1: todaydate, des: weatherDesc, place: query, img: imgurl });
                } else {
                    console.error("Invalid weather data format received or no data available.");
                    res.render("home/index", { temp1: "", date1: todaydate, des: "Weather data not available", place: query, img: imgurl });
                }
            } catch (error) {
                console.error("Error parsing weather data:", error);
                res.render("home/index", { temp1: "", date1: todaydate, des: "Error fetching weather data", place: query, img: imgurl });
            }
        });
    }).on("error", (error) => {
        console.error("Error making API request:", error);
        res.render("home/index", { temp1: "", date1: todaydate, des: "Error fetching weather data", place: query, img: imgurl });
    });
});

app.use("/", userRouter);

app.listen(PORT, () => {
    console.log(`Server is listening at PORT ${PORT}`);
});
