'use strict'

const Client = require('./client')
const defaults = require('./defaults')
const Connection = require('./connection')
const Result = require('./result')
const utils = require('./utils')
const Pool = require('pg-pool')
const TypeOverrides = require('./type-overrides')
const { DatabaseError } = require('pg-protocol')
const { escapeIdentifier, escapeLiteral } = require('./utils')

const poolFactory = (Client) => {
  return class BoundPool extends Pool {
    constructor(options) {
      super(options, Client)
    }
  }
}

const PG = function (clientConstructor) {
  this.defaults = defaults
  this.Client = clientConstructor
  this.Query = this.Client.Query
  this.Pool = poolFactory(this.Client)
  this._pools = []
  this.Connection = Connection
  this.types = require('pg-types')
  this.DatabaseError = DatabaseError
  this.TypeOverrides = TypeOverrides
  this.escapeIdentifier = escapeIdentifier
  this.escapeLiteral = escapeLiteral
  this.Result = Result
  this.utils = utils
}

let clientConstructor = Client

try {
  if (process.env.NODE_PG_FORCE_NATIVE) {
    clientConstructor = require('./native')
  }
} catch {
  // ignore, e.g., Deno without --allow-env
}

module.exports = new PG(clientConstructor)

// lazy require native module...the native module may not have installed
Object.defineProperty(module.exports, 'native', {
  configurable: true,
  enumerable: false,
  get() {
    let native = null
    try {
      native = new PG(require('./native'))
    } catch (err) {
      if (err.code !== 'MODULE_NOT_FOUND') {
        throw err
      }
    }

    // overwrite module.exports.native so that getter is never called again
    Object.defineProperty(module.exports, 'native', {
      value: native,
    })

    return native
  },
})
