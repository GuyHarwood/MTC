'use strict'

/* global beforeEach, describe, it, expect */

const settingsValidator = require('../../../../lib/validator/settings-validator')
const expressValidator = require('express-validator')()

describe('Settings validator', function () {
  let req = null

  function getBody () {
    return {
      questionTimeLimit: '20',
      loadingTimeLimit: '3',
      checkTimeLimit: '30'
    }
  }

  beforeEach(function (done) {
    req = {
      query: {},
      body: {},
      params: {},
      param: (name) => {
        this.params[name] = name
      }
    }

    return expressValidator(req, {}, function () {
      done()
    })
  })

  it('should allow a valid request', async function (done) {
    req.body = getBody()
    let validationError = await settingsValidator.validate(req.body)
    expect(validationError.hasError()).toBe(false)
    done()
  })

  it('should require questionTimeLimit as mandatory', async function (done) {
    req.body = getBody()
    req.body.questionTimeLimit = ''
    let validationError = await settingsValidator.validate(req.body)
    expect(validationError.hasError()).toBe(true)
    expect(validationError.isError('questionTimeLimit')).toBe(true)
    done()
  })

  it('should require questionTimeLimit to be at least 1', async function (done) {
    req.body = getBody()
    req.body.questionTimeLimit = '0'
    let validationError = await settingsValidator.validate(req.body)
    expect(validationError.hasError()).toBe(true)
    expect(validationError.isError('questionTimeLimit')).toBe(true)
    done()
  })

  it('should require questionTimeLimit to be not greater than 60', async function (done) {
    req.body = getBody()
    req.body.questionTimeLimit = '62'
    let validationError = await settingsValidator.validate(req.body)
    expect(validationError.hasError()).toBe(true)
    expect(validationError.isError('questionTimeLimit')).toBe(true)
    done()
  })

  it('should require loadingTimeLimit as mandatory', async function (done) {
    req.body = getBody()
    req.body.loadingTimeLimit = ''
    let validationError = await settingsValidator.validate(req.body)
    expect(validationError.hasError()).toBe(true)
    expect(validationError.isError('loadingTimeLimit')).toBe(true)
    done()
  })

  it('should require loadingTimeLimit to be at least 1', async function (done) {
    req.body = getBody()
    req.body.loadingTimeLimit = '0'
    let validationError = await settingsValidator.validate(req.body)
    expect(validationError.hasError()).toBe(true)
    expect(validationError.isError('loadingTimeLimit')).toBe(true)
    done()
  })

  it('should require loadingTimeLimit to be no more than 5', async function (done) {
    req.body = getBody()
    req.body.loadingTimeLimit = '7'
    let validationError = await settingsValidator.validate(req.body)
    expect(validationError.hasError()).toBe(true)
    expect(validationError.isError('loadingTimeLimit')).toBe(true)
    done()
  })

  it('should require checkTimeLimit as mandatory', async function (done) {
    req.body = getBody()
    req.body.checkTimeLimit = ''
    let validationError = await settingsValidator.validate(req.body)
    expect(validationError.hasError()).toBe(true)
    expect(validationError.isError('checkTimeLimit')).toBe(true)
    done()
  })

  it('should require checkTimeLimit to be at least 10', async function (done) {
    req.body = getBody()
    req.body.checkTimeLimit = '9'
    let validationError = await settingsValidator.validate(req.body)
    expect(validationError.hasError()).toBe(true)
    expect(validationError.isError('checkTimeLimit')).toBe(true)
    done()
  })

  it('should require checkTimeLimit to be not greater than 90', async function (done) {
    req.body = getBody()
    req.body.checkTimeLimit = '91'
    let validationError = await settingsValidator.validate(req.body)
    expect(validationError.hasError()).toBe(true)
    expect(validationError.isError('checkTimeLimit')).toBe(true)
    done()
  })
})
