const express = require('express')
const router = new express.Router()
const Task = require('../models/task')
const auth = require('../middleware/auth')

router.post('/tasks', auth, async (req, res) => {
    // const task = new Task(req.body)
    const task = new Task({
        ...req.body,
        userID: req.user._id
    })

    try {
        await task.save()
        res.status(201).send(task)
    } catch(e){
        res.status(400).send(e)
    }
})

router.get("/tasks", auth, async (req, res) => {
    const match = {}
    const sort = {}
    if(req.query.status){
        match.status = req.query.status === 'true'
    }
    let asc_desc = null
    if(req.query.sortBy){
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort: {
                    createdAt: asc_desc
                }
            }
        }).execPopulate()
        res.status(201).send(req.user.tasks)
    } catch(e){
        res.status(500).send("Error connecting to service. Try again later!")
    }
})

router.get("/tasks/:id", auth, async (req, res) => {
    const _id = req.params.id
    try {
        const task = await Task.findOne({ _id, userID: req.user._id })

        if(!task) return res.status(404).send("No Task for that id")
        res.send(task)
    } catch(e){
        res.status(500).send("Error: Try again later")
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'status']
    const isValidOperation = updates.every(update => allowedUpdates.includes(update))

    if(!isValidOperation){
        return res.status(400).send({'error': 'Invalid Update'})
    }

    try {
        const task = await Task.findOne({ _id: req.params.id, userID: req.user._id })

        // Doesnt work with Middleware
        // const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        if(!task) return res.status(404).send('No task with that id')

        updates.forEach(update => task[update] = req.body[update])
        await task.save()
        
        res.send(task)
    } catch(e) {
        res.status(400).send(e)
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, userID: req.user._id })
        if(!task) return res.status(404).send('No task with that id')
        res.send(task)
    } catch(e) {
        res.status(500).send(e)
    }
})

module.exports = router