require('dotenv').config()

const express = require('express')
const bodyParser = require('body-parser')

const service = require('./pollyService')
const logger = require('./logger')
const { getIds } = require('./helper')

const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.post('/hook', async (req, res) => {
  const [question, ...answers] = req.body.text.split('|')
  
  const message = await service.storeQuestion({
    user: req.body.user_name,
    question
  }, answers)
  
  res.send(message)
})

app.post('/action', async (req, res) => {
  const payload = JSON.parse(req.body.payload)
  const [questionId, answerId] = getIds(payload)
  
  res.send()

  await service.storeVote({
    answer_id: answerId,
    user: payload.user
  })

  service.updateOriginalMessage(questionId, payload.response_url)
})

app.listen(process.env.PORT, () => {
  logger.info(`server started at ${process.env.PORT}`)
})

