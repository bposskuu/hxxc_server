const jwt = require('jsonwebtoken')
const config = require('config')

module.exports = (req, res, next) => {
    if (req.method === 'OPTIONS') {
        return next()
    }

    try {
        const token = req.headers.authorization.split(' ')[1]
        if (!token) {
            return req.status(401).json({message: 'Error auth token'})
        }
        const decoded = jwt.decode(token, config.get('jwt-secret'))
        req.user = decoded
        next()
    } catch (e) {
        console.log(e)
        return res.status(401).json({message: 'Error auth'})
    }
}