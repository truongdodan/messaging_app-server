const errorHandle = (err, req, res, next) => {
    console.error("Handle Error.");
    console.log(err);

    res.status(err.statusCode || 500).json({
        error: {
            name: err.name,
            status: err.statusCode,
            msg: err.message,
            details: err.errorDetails,
        }
    })
}

module.exports = errorHandle;