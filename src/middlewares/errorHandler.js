const errorHandle = (err, req, res, next) => {
  console.error("Handle error at the end of the App.");
  console.error(err);

  res.status(err.statusCode || 500).json({
    error: {
      name: err.name,
      status: err.statusCode,
      msg: err.message,
      details: err.errorDetails,
    },
  });
};

module.exports = errorHandle;
