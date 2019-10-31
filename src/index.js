require('dotenv').config()

const express = require('express')
const bodyParser = require('body-parser')

const service = require('./pollyService')
const { getIds } = require('./helper')

const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.post('/hook', async (req, res) => {
  const [question, ...answers] = req.body.text.split('|')
  
  const current = await service.storeQuestion({
    user: req.body.user_name,
    question
  }, answers)
  
  res.send(service.slackMessage(current))
})

app.post('/action', async (req, res) => {
  const payload = JSON.parse(req.body.payload)
  const [questionId, answerId] = getIds(payload)

  await service.handleVote({
    answer_id: answerId,
    user: payload.user.username
  })
  
  res.send({
    text: 'You voted.'
  })
  
  service.updateOriginalMessage(questionId, payload.response_url)
})

app.listen(process.env.PORT, () => {
  console.log(`server started at ${process.env.PORT}`)
})

