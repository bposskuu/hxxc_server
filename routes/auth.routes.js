const Router = require('express')
const {check, validationResult} = require("express-validator")
const router = new Router()
const authMiddleware = require('../middleware/auth.middleware')
const authController = require('../controllers/authController')

router.post('/registration',
    [
        check('email', 'incorrect email').isEmail(),
        check('password', 'Password must be longer than 3 and shorter than 12').isLength({min: 3, max: 12})
    ],
    authController.registration)

router.get('/auth', authMiddleware, authController.auth)

router.post('/login', authController.login)

module.exports = router