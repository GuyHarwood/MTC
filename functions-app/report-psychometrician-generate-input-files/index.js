'use strict'

const { performance } = require('perf_hooks')

const v1 = require('./v1')
const name = 'report-psychometrician-generate-input-files'

module.exports = async function (context, message) {
  const start = performance.now()

  try {
    await v1.process(context.log)
  } catch (error) {
    context.log.error(`${name}: ERROR run failed: ${error.message}`)
    throw error
  }

  const end = performance.now()
  const durationInMilliseconds = end - start
  const timeStamp = new Date().toISOString()
  context.log(`${name}: ${timeStamp} run took ${Math.round(durationInMilliseconds) / 1000} seconds`)
}
