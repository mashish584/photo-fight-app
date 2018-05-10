exports.isLoggedIn = (req, res, next) => {
  let { userId } = req.session;
  if (!userId) return res.redirect('/signin');
  next();
};

exports.notLoggedIn = (req, res, next) => {
  let { userId } = req.session;
  if (userId) return res.redirect('/home');
  next();
};

exports.isAdmin = (req, res, next) => {
  let { user } = req.session;
  if (user.role === 0) return res.redirect('/home');
  next();
};

// Guards for routes other than GET => AJAX

exports.authorizeUser = (req, res, next) => {
  let { userId, user } = req.session;
  if (!userId || user.role === 0) {
    return res.status(401).json({ message: 'Unauthorize Access' });
  } else {
    next();
  }
};

exports.isUser = (req, res, next) => {
  let { userId } = req.session;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorize Access' });
  } else {
    next();
  }
};
