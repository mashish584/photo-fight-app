exports.catchAsyncError = fn => {
  return (req, res, next) => {
    return fn(req, res, next).catch(next);
  };
};

exports.notFound = (req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
};

exports.validationErrors = (err, req, res, next) => {
  if (err.code === 11000) {
    req.flash('error', 'Email already in use');
    return res.redirect('back');
  }
  if (!err.errors) return next(err);
  let { errors } = err;
  let errorKeys = Object.keys(errors);
  let { message } = errors[errorKeys[0]];
  req.flash('error', message);
  return res.redirect('back');
};

exports.catchError = (err, req, res, next) => {
  err.status = err.status || 500;
  return res.json(err);
};
