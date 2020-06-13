const express = require('express')

require('./db/mongoose')
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const app = express()
const port = process.env.PORT

app.use(express.json())

app.listen(port, () => {
    console.log('Server running on port: ' + port)
})

app.use(userRouter)
app.use(taskRouter)