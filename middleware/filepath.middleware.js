function filePath(path) {
    return function (req, res, next) {
        req.filePath = path + '/storage'
        req.staticPath = path + '/static'
        next();
    }
}



module.exports = filePath