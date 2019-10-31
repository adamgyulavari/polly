const response = ({question, user}) => (
{
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `*${question}* Poll by ${user}`
      }
    }
  ]
})

const answer = (questionId, {answer, voters = [], id}) => (
{
  "type": "section",
  "text": {
    "type": "mrkdwn",
    "text": `*${answer}* ${voters.length} votes\n` + voters.join(', ')
  },
  "accessory": {
    "type": "button",
    "text": {
      "type": "plain_text",
      "emoji": true,
      "text": "Vote"
    },
    "value": `${questionId}-${id}`
  }
})

const message = (question) => {
  const message = response(question)
  question.answers.forEach((a) => message.blocks.push(answer(question.id, a)))
  message.response_type = 'in_channel'
  return message
}

module.exports = message
