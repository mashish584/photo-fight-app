const express = require('express');
const router = express.Router();
const { catchAsyncError } = require('../handlers/errorHandler');

// controllers
const {
  getSignIn,
  getSignUp,
  register,
  auth,
  signOut,
} = require('../controllers/authController');

// guards
const { notLoggedIn } = require('../handlers/routeGuard');

/*
    => Auth GET Routes
*/

router.get('/signin', notLoggedIn, getSignIn);

router.get('/signup', notLoggedIn, getSignUp);

router.get('/signout', signOut);

/*
    => Auth POST Routes
*/

router.post('/signin', notLoggedIn, catchAsyncError(auth));

router.post('/signup', notLoggedIn, catchAsyncError(register));

module.exports = router;
