const fetch = require('node-fetch')

const databaseApi = require('./db')
const slackMessage = require('./slack')
const db = databaseApi(true)

const updateOriginalMessage = async (questionId, url) => {
  const question = await getFullQuestion(questionId)
  const newMessage = slackMessage(question)
  newMessage.replace_original = true

  fetch(url, {
    method: 'POST',
    body: JSON.stringify(newMessage),
    headers: {'Content-Type': 'application/json'}
  }).then(res => res.json()).then(console.log)
}

const handleVote = async (vote) => {
  const dbVote = await db.find('votes', vote)
  if(dbVote.length === 1) {
    await db.remove('votes', dbVote[0].id)
  } else {
    await db.save('votes', vote)
  }
}

const getFullQuestion = async (questionId) => {
  const question = await db.findOne('questions', questionId)
  question.answers = await db.find('answers', {question_id: questionId})
  for(let answer of question.answers) {
    answer.voters = (await db.find('votes', {answer_id: answer.id})).map(a => a.user)
  }
  return question
}

const storeQuestion = async (question, answers) => {
  await db.save('questions', question)
  
  question.answers = []
  for(let answer of answers) {
    let answerData = { question_id: question.id, answer }
    await db.save('answers', answerData)
    question.answers.push(answerData)
  }
  return question
}

module.exports = {
  getFullQuestion,
  handleVote,
  updateOriginalMessage,
  slackMessage,
  storeQuestion
}
