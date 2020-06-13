const express = require('express')
const router = new express.Router()
const User = require('../models/user')
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')

router.post('/users', async (req, res) => {
    const user = new User(req.body)
    
    try {
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({user, token})
    } catch(e){
        res.status(400).send(e)
    }
})

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch(e) {
        res.status(400).send('Error')
    }
})

router.get("/profile", auth, async (req, res) => {
    res.send(req.user)
})

router.get("/users/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if(!user) return res.status(404).send("No User for that id")
        res.send(user)
    } catch(e){
        res.status(500).send("Error: Try again later")
    }
})

router.patch('/users/profile', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every(update => allowedUpdates.includes(update))

    if(!isValidOperation){
        return res.status(400).send({'error': 'Invalid Update'})
    }

    try {
        user = req.user
        updates.forEach((update) => user[update] = req.body[update])
        await user.save()
        res.send(user)
    } catch(e) {
        res.status(400).send(e)
    }
})

router.delete('/users/profile', auth, async (req, res) => {
    try {
        await req.user.remove()
        res.send(req.user)
    } catch(e) {
        res.status(500).send(e)
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => {
            return token.token !== req.token
        })
        await req.user.save()

        res.send()
    } catch(e) {
        res.status(500).send()
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()

        res.send()
    } catch(e) {
        res.status(500).send()
    }
})

// Uploaded Image Contraints
const upload = multer({
    limits: {
        fileSize: 5000000
    },
    fileFilter(req, file, callback){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return callback(new Error('Please upload a valid Image file'))
        }
        callback(undefined, true)
    }
})

router.post('/users/profile/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 300, height: 300 }).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send("Avatar Uploaded Successfully!")
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

router.delete('/users/profile/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send('Avatar deleted successfully')
})

router.get('/users/profile/avatar', auth, async (req, res) => {
    try {
        const user = req.user

        if(!user || !user.avatar){
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch(e) {
        res.status(404).send('Error Fetching Avatar')
    }
})

module.exports = router