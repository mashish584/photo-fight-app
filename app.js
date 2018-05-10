const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo')(session);

// error Handlers
const {
  catchAsyncError,
  notFound,
  validationErrors,
  catchError,
} = require('./handlers/errorHandler');

// routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(
  session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 1000 }, //1hour
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
  })
);

app.use(flash());

app.use(
  catchAsyncError(async (req, res, next) => {
    res.locals.user = req.session.userId || null;
    res.locals.error = req.flash('error') || null;
    res.locals.success = req.flash('success') || null;
    res.locals.userMeta = req.session.user || null;
    next();
  })
);

app.use('', authRoutes);
app.use('', userRoutes);

app.use(notFound);
app.use(validationErrors);
app.use(catchError);

module.exports = app;
