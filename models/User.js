const {Schema, model, ObjectId} = require("mongoose")

const User = new Schema({
    email: {type: String, require: true, unique: true},
    password: {type: String, require: true},
    name: {type: String},
    diskSpace: {type: Number, default: 1024**3*10},
    usedSpace: {type: Number, default: 0},
    avatar: {type: String},
    files : [{type: ObjectId, ref:'File'}]

})

module.exports = model('User', User)