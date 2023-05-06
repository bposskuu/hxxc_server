const Router = require('express')
const router = new Router()
const authMiddleware = require('../middleware/auth.middleware')
const fileController = require('../controllers/fileController')

router.get('', authMiddleware, fileController.getFiles)
router.get('/download', authMiddleware, fileController.downloadFile)
router.get('/byaccesslink', fileController.getFileByAccessLink)
router.get('/accesslink', authMiddleware, fileController.getAccessLink)

router.post('', authMiddleware, fileController.createDir)
router.post('/upload', authMiddleware, fileController.uploadFile)
router.post('/avatar', authMiddleware, fileController.uploadAvatar)

router.put('', authMiddleware, fileController.renameFile)

router.delete('', authMiddleware, fileController.removeFile.bind(fileController))
router.delete('/removeArchive', authMiddleware, fileController.removeArchive)
router.delete('/accesslink', authMiddleware, fileController.removeAccessLink)
router.delete('/avatar', authMiddleware, fileController.removeAvatar)


module.exports = router