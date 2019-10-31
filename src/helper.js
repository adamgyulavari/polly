const getIds = (payload) => {
  let [questionId, answerId] = payload.actions[0].value.split('-')
  questionId = parseInt(questionId)
  answerId = parseInt(answerId)
  return [questionId, answerId]
}

module.exports = { getIds }
