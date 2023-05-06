const fileService = require('../services/fileService')
const config = require("config")
const User = require('../models/User')
const File = require('../models/File')
const Uuid = require('uuid')
const fs = require("fs")

class FileController {

    async createDir(req, res) {
        try {
            const {name, type, parent} = req.body
            const file = new File({name,type,parent, user: req.user.id, date: Date.now(), path: ''})
            const parentFile = await File.findOne({_id: parent})

            file.path = `${parentFile ? parentFile.path+'//'+file.name : file.name}`
            await fileService.createDir(req, file)

            if (parentFile) {
                parentFile.childs.push(file)
                await parentFile.save()
            }

            await file.save()
            return res.json(file)
        } catch (e) {
            console.log(e)
            return res.status(400).json(e)
        }
    }

    async getFiles(req, res) {
        try {
            const {sort, direction} = req.query
            let files;
            switch (sort) {
                case 'name':
                    files = await File.find({user: req.user.id, parent: req.query.parent})
                    files.sort((a,b) => {
                        return direction === '1' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
                    });
                    break;
                case 'size':
                    files = await File.find({user: req.user.id, parent: req.query.parent}).sort({size: direction})
                    break;
                case 'type':
                    files = await File.find({user: req.user.id, parent: req.query.parent}).sort({type: direction})
                    break;
                case 'date':
                    files = await File.find({user: req.user.id, parent: req.query.parent}).sort({date: direction})
                    break;
                default:
                    files = await File.find({user: req.user.id, parent: req.query.parent})
                    break;
            }

            return res.json(files)
        } catch (e) {
            console.log(e)
            return res.status(500).json(e)
        }
    }

    async removeFile(req,res) {
        try {
            const file_id = req.query.id
            const user = await User.findOne({_id: req.user.id})
            const file = await File.findOne({_id: file_id})
            const parent = await File.findOne({_id: file.parent})

            if (parent) {
                parent.childs.splice(parent.childs.indexOf(file._id), 1)
                await parent.save()
            }

            const size = await this.removeChilds(file)
            user.usedSpace -= size
            user.usedSpace -= file.size
            await user.save()

            await fileService.removeFile(req, file)

            await File.deleteOne({_id: file_id})
            return res.json({file_id: file_id, user: user})
        } catch (e) {
            console.log(e)
            return res.status(400).json(e)
        }
    }

    async renameFile(req,res) {
        try {
            const {id, name} = req.body
            const file = await File.findOne({_id: id})
            const parent = await File.findOne({_id: file.parent})

            await fileService.renameFile(req, file, name)

            file.name = name
            file.path = `${parent ? parent.path+'//'+name : name}`

            await file.save()
            return res.json(file)
        } catch (e) {
            console.log(e)
            return res.status(400).json(e)
        }
    }

    async uploadFile(req, res) {
        try {
            const file = req.files.file
            const parent = await File.findOne({user: req.user.id, _id: req.body.parent})
            const user = await User.findOne({_id: req.user.id})
            if (user.usedSpace + file.size > user.diskSpace) {
                return res.status(400).json({message: "No space on the disk"})
            }
            user.usedSpace += file.size

            const path = `${req.filePath}//${user._id}//${parent ? parent.path+'//' : ''}${file.name}`

            if (fs.existsSync(path)) {
                return res.status(400).json({message: "File already exist"})
            }

            file.mv(path)

            const filePath = `${parent ? parent.path+'//' : ''}${file.name}`

            const type = file.name.split('.').pop()
            const dbFile = new File({
                name: file.name,
                type,
                size: file.size,
                path: filePath,
                parent: parent ? parent._id : null,
                user: user._id
            })

            if (parent) {
                parent.childs.push(dbFile)
                await parent.save()
            }

            await dbFile.save()
            await user.save()

            return res.json({file: dbFile, user: user})
        } catch (e) {
            console.log(e)
            return res.status(500).json(e)
        }
    }

    async downloadFile(req,res) {
        try {
            const file = await File.findOne({_id: req.query.id, user: req.user.id})
            const path = `${req.filePath}//${req.user.id}//${file.path}`

            if (file.type === 'dir') {
                let archivePath
                await fileService.archiveDir(req, file).then((resolve) => {
                    archivePath = resolve.path
                })
                return res.download(archivePath)

            } else {
                if (fs.existsSync(path)) {
                    return res.download(path)
                }
            }

            return res.status(400).json({message: 'Download error'})
        } catch (e) {
            console.log(e)
            return res.status(400).json(e)
        }
    }

    async removeArchive(req,res) {
        try {
            const file = await File.findOne({_id: req.query.id, user: req.user.id})
            const archivePath = `${req.filePath}//temp//${req.user.id}//${file.name}.zip`

            if (file) {

                if (fs.existsSync(archivePath)) {
                    fs.rmSync(archivePath)
                    return res.status(200)
                }
                return res.status(400).json({message: "Archive not found"})
            }

            return res.status(400).json({message: "File not found"})
        } catch (e) {
            console.log(e)
            return res.status(400).json(e)
        }
    }

    async removeChilds(file) {
        let fullSize = 0
        if (file.childs) {
            await Promise.all(file.childs.map(async (child) => {
                const dbChild = await File.findOne({_id: child})
                fullSize += dbChild.size
                fullSize += await this.removeChilds(dbChild)
                await File.deleteOne({_id: child})
            }))
        }
        return fullSize
    }

    async getFileByAccessLink(req, res) {
        try {
            const file = await File.findOne({accessLink: req.query.url})

            if (file) {
                return res.json(file)
            }

            return res.status(404).json({message: 'Файл не найден'})
        } catch (e) {
            console.log(e)
            return res.status(500).json(e)
        }
    }

    async getAccessLink(req, res) {
        try {
            const file = await File.findOne({_id: req.query.id})

            let link
            while(1) {
                link = Math.random().toString(36).substr(2, 10)
                const clone = await File.findOne({accessLink: link})
                if (!clone) break
            }


            file.accessLink = link
            await file.save()

            return res.json(file)
        } catch (e) {
            console.log(e)
            return res.status(500).json(e)
        }
    }

    async removeAccessLink(req, res) {
        try {
            const file = await File.findOne({_id: req.query.id})

            file.accessLink = null
            await file.save()

            return res.json(file)
        } catch (e) {
            console.log(e)
            return res.status(500).json(e)
        }
    }

    async uploadAvatar(req, res) {
        try {
            const file = req.files.file
            const user = await User.findOne({_id: req.user.id})
            const avatarName = Uuid.v4() + '.png'

            if (user.avatar) {
                fs.rmSync(req.staticPath + '//' + user.avatar)
            }
            if (!fs.existsSync(req.staticPath)) {
                fs.mkdirSync(req.staticPath)
            }
            file.mv(req.staticPath + '//' + avatarName)
            user.avatar = avatarName
            await user.save()

            return res.json(user)
        } catch (e) {
            console.log(e)
            return res.status(500).json(e)
        }
    }

    async removeAvatar(req, res) {
        try {
            const user = await User.findOne({_id: req.user.id})

            if (user.avatar) {
                fs.rmSync(req.staticPath + '//' + user.avatar)
            }

            user.avatar = null
            await user.save()

            return res.json(user)
        } catch (e) {
            console.log(e)
            return res.status(500).json(e)
        }
    }
}

module.exports = new FileController()