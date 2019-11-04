const LOG_LEVEL = process.env.LOG_LEVEL

const LEVELS = ['error', 'info', 'debug']

const logger = LEVELS.reduce((prev, level) => {
  prev[level] = (...message) => {
    if(LEVELS.indexOf(LOG_LEVEL) >= LEVELS.indexOf(level)) {
      console[level](_getDate(), level.toUpperCase(), ...message)
    }
  }
  return prev
}, {})

const _getDate = () => {
  return new Date().toISOString().split('T')[0]
}

module.exports = logger
