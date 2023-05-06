const express = require("express")
const mongoose = require("mongoose")
const config = require("config")
const {mongo} = require("mongoose");
const authRouter = require("./routes/auth.routes")
const fileUpload = require("express-fileupload")
const fileRouter = require("./routes/file.routes")
const cors = require("./middleware/cors.middleware")
const filePath = require("./middleware/filepath.middleware");
const path = require('path')

const app = express()
const PORT = process.env.PORT || config.get("serverPort")

app.use(express.json())
app.use(cors)
app.use(filePath(path.resolve()))
app.use(fileUpload({}))
app.use(express.static('static'))
app.use("/api/auth", authRouter)
app.use("/api/files", fileRouter)

const start = async () => {
    try {

        await mongoose.connect(config.get("dbUrl"))

        app.listen(PORT, () => {
            console.log("server started on PORT:", PORT)
        })
    } catch (e) {
        console.log(e)
    }
}

start()