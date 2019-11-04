const fetch = require('node-fetch')

const databaseApi = require('./db')
const slack = require('./slack')
const logger = require('./logger')
const db = databaseApi(true)

const updateOriginalMessage = async (questionId, url) => {
  const question = await _getFullQuestion(questionId)
  const newMessage = slack.message(question)
  newMessage.replace_original = true
  
  logger.debug('Updating message on Slack', JSON.stringify(newMessage))

  fetch(url, {
    method: 'POST',
    body: JSON.stringify(newMessage),
    headers: {'Content-Type': 'application/json'}
  }).then(res => res.json()).then(logger.debug)
}

const storeVote = async (vote) => {
  const userId = vote.user.id
  vote.user = vote.user.username
  const dbVote = await db.find('votes', vote)
  if(dbVote.length === 1) {
    await db.remove('votes', dbVote[0].id)
    logger.info('Vote removed with id ' + dbVote[0].id)
  } else {
    vote.pic = (await fetch(_getUserProfileUrl(userId))
      .then(res => res.json())).profile.image_24
    await db.save('votes', vote)
    logger.info('Vote stored with id ' + vote.id)
  }
}

const storeQuestion = async (question, answers) => {
  if(!_valid.user(question)) return slack.privateFeedback(_TERRIBLE_ERROR)
  if(!_valid.question(question)) return slack.privateFeedback(_NO_QUESTION)
  if(!_valid.answers(answers)) return slack.privateFeedback(_NO_ANSWERS)
  
  await db.save('questions', question)
  
  question.answers = []
  for(let answer of answers) {
    let answerData = { question_id: question.id, answer }
    await db.save('answers', answerData)
    question.answers.push(answerData)
  }

  logger.info('Question stored with id ' + question.id)
  return slack.message(question)
}

const _getUserProfileUrl = (userId) => 
  `https://slack.com/api/users.profile.get?user=${userId}&token=${process.env.SLACK_TOKEN}`

const _getFullQuestion = async (questionId) => {
  const question = await db.findOne('questions', questionId)
  question.answers = await db.find('answers', {question_id: questionId})
  for(let answer of question.answers) {
    answer.voters = (await db.find('votes', {answer_id: answer.id}))
  }
  return question
}

const _valid = {
  question: (question) => question && question.question,
  user: (question) => question && question.user,
  answers: (answers) => answers && answers.length > 0
}

const _TERRIBLE_ERROR = 'Something went terribly wrong, maybe something changed in Slack API, but I didnt get the username.'
const _NO_QUESTION = 'A question or poll needs a question or title. Usage hint: `/polly What is my fav color?|blue|red`'
const _NO_ANSWERS = 'A question or poll must have answers or options.'

module.exports = {
  updateOriginalMessage,
  message: slack.message,
  storeQuestion,
  storeVote
}

