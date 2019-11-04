const _response = ({question, user}) => (
{
  blocks: [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${question}`
      }
    },
    {
      type: 'context',
      elements: [{
        type: 'plain_text',
        emoji: true,
        text: `Poll by ${user}`
      }]
    },
    {
			type: 'divider'
		},
  ]
})

const _answer = (questionId, {answer, voters = [], id}) => (
  [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${answer} \`${voters.length}\``
      },
      accessory: {
        type: 'button',
        text: {
          type: 'plain_text',
          emoji: true,
          text: 'Vote'
        },
        value: `${questionId}-${id}`
      }
    },
    {
      type: 'context',
      elements: _voters(voters)
    }
  ]
)

const _voters = (voters) => {
  if(voters.length > 0) {
    return voters.map(voter => ({
      type: 'image',
      image_url: voter.pic,
      alt_text: voter.user
    })).concat([{
      type: 'plain_text',
      text: voters.length > 1 ? `${voters.length} votes` : 'one vote'
    }])
  } else {
    return [{
      type: 'plain_text',
      emoji: true,
      text: 'No voters yet.'
    }]
  }
}

const message = (question) => {
  const message = _response(question)
  question.answers.forEach((a) => message.blocks = message.blocks.concat(_answer(question.id, a)))
  message.response_type = 'in_channel'
  return message
}

const privateFeedback = (message) => {
  return {
    'response_type': 'ephemeral',
    text: message
  }
}

module.exports = {
  message,
  privateFeedback
}
