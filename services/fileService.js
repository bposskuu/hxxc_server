const fs = require('fs')
const File = require('../models/File')
const config = require('config')
const zipFolder = require('zip-folder')

class FileService {

    createDir(req, file) {
        const filePath = this.getFilePath(req, file)
        return new Promise((resolve, reject) => {
            try {
                if (!fs.existsSync(filePath)) {
                    fs.mkdirSync(filePath)
                    return resolve({message: "File was created"})
                } else {
                    return reject({message: "File already exist"})
                }
            } catch (e) {
                console.log(e)
                return reject({message: 'File error'})
            }
        })
    }

    removeFile(req, file) {
        const filePath = this.getFilePath(req, file)
        return new Promise((resolve, reject) => {
            try {
                if (fs.existsSync(filePath)) {
                    fs.rmSync(filePath, {recursive: true})
                    return resolve({message: "File removed"})
                } else {
                    return reject({message: "File not found"})
                }
            } catch (e) {
                console.log(e)
                return reject({message: 'File error'})
            }
        })
    }

    renameFile(req, file, name) {
        const filePath = this.getFilePath(req, file)
        const newFilePath = filePath.replace(filePath.split('/').pop(), name)
        return new Promise((resolve, reject) => {
            try {
                if (fs.existsSync(filePath)) {
                    fs.renameSync(filePath, newFilePath)
                    return resolve({message: "File renamed"})
                } else {
                    return reject({message: "File not found"})
                }
            } catch (e) {
                console.log(e)
                return reject({message: 'File error'})
            }
        })
    }

    archiveDir(req, file) {
        const tempPath =  `${req.filePath}/temp/${file.user}`
        const filePath = this.getFilePath(req, file)
        const archivePath = tempPath+`/`+file.name+'.zip'

        return new Promise((resolve, reject) => {
            try {
                if (!fs.existsSync(tempPath)) {
                    fs.mkdirSync(tempPath)
                }

                if (!fs.existsSync(archivePath)) {
                    zipFolder(filePath, archivePath, (err) => {
                        if (err) return reject({message: err})
                        else return resolve({message: "Directory archived", path: archivePath})
                    })
                }
            } catch (e) {
                console.log(e)
                return reject({message: 'Archive error'})
            }
        })
    }

    getFilePath(req, file) {
        return `${req.filePath}/${file.user}/${file.path}`
    }
}

module.exports = new FileService()