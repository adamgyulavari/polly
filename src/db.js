const mysql = require('mysql')
const logger = require('./logger')

class DatabaseAPI {

  constructor(withLogs = false) {
    this.logEnabled = withLogs
    this._connection = mysql.createConnection({
      host     : process.env.DB_URL,
      user     : process.env.DB_USER,
      password : process.env.DB_PASSWORD,
      database : process.env.DB_NAME
    })
    this._connection.connect()
    try {
      this._initTablesIfNecessary()
    } catch (error) {
      logger.error('Error while initializing the database tables', error)
    }
  }

  async save(table, data) {
    const {keys, values} = this._convertKeysAndValues(data)
    try {
      const result = await this.query(`INSERT INTO ${table} (${keys.join(', ')}) VALUES (${values.join(', ')})`)
      data.id = result.insertId
      return result
    } catch (error) {
      logger.error('Cant save record into' + table, error)
    }
    return null
  }

  findAll(table, ids) {
    let sql = 'SELECT * FROM ?'
    let data = [table]
    if(ids) {
      sql += 'WHERE id IN ?'
      data.push(ids)
    }
    return this.query(sql, data)
  }

  async findOne(table, id) {
    let result = await this.query(`SELECT * FROM ${this._connection.escapeId(table)} WHERE id=?`, [id])
    if(result.length === 1) {
      return result[0]
    } else return null
  }

  find(table, selectors) {
    let sql = `SELECT * FROM ${this._connection.escapeId(table)}`
    if(selectors) {
      sql += ' WHERE '
      sql += Object.entries(selectors).map(
        ([key, value]) => 
          this._connection.escapeId(key) + '=' + this._connection.escape(value)).join(' AND ')
    }
    return this.query(sql)
  }

  remove(table, id) {
    return this.query(`DELETE FROM ${this._connection.escapeId(table)} WHERE id=?`, [id])
  }

  _convertKeysAndValues(keysAndValues) {
    return Object.entries(keysAndValues).reduce((prev, [key, value]) => {
      prev.keys.push(this._connection.escapeId(key))
      prev.values.push(this._connection.escape(value))
      return prev
    }, {keys: [], values: []})
  }

  _initTablesIfNecessary() {
    this._createTable({
      name: 'questions',
      id: 'INT AUTO_INCREMENT PRIMARY KEY',
      question: 'VARCHAR(255) NOT NULL',
      user: 'VARCHAR(255) NOT NULL'
    })
    this._createTable({
      name: 'answers',
      id: 'INT AUTO_INCREMENT PRIMARY KEY',
      answer: 'VARCHAR(255) NOT NULL',
      question_id: 'INT NOT NULL'
    })
    this._createTable({
      name: 'votes',
      id: 'INT AUTO_INCREMENT PRIMARY KEY',
      user: 'VARCHAR(255) NOT NULL',
      pic: 'VARCHAR(255) NOT NULL',
      answer_id: 'INT NOT NULL'
    })
  }

  async _createTable({name, ...fields}) {
    await this.query(`CREATE TABLE IF NOT EXISTS ${name} (`
      + Object.entries(fields).map(([field, type]) => `${field} ${type}`).join(', ') + ')')
    logger.info(`${name} table created.`)
  }

  query(sql, params) {
    return new Promise((resolve, reject) => {
      let query = this._connection.query(sql, params, (error, results, fields) => {
        logger.debug(query.sql)
        if(error) return reject(error)
        logger.debug(results)
        resolve(results, fields)
      })
    })
  }
}





module.exports=function(withLogs) {
  return new DatabaseAPI(withLogs)
}
