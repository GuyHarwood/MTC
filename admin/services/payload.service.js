'use strict'
const moment = require('moment')
const R = require('ramda')

const payloadDataService = require('./data-access/payload.data.service')

const payloadService = {
  /**
   * Add relative timings to an array of objects that have 'clientTimestamp' property
   * @param {{clientTimeStamp}[]} objects
   * @return {Array}
   */
  addRelativeTimingsToSection: function addRelativeTimingsToSection (objects) {
    let lastTime, current
    const output = [] // output array
    for (let obj of objects) {
      if (!obj) {
        output.push(obj)
        continue
      }

      if (!obj.clientTimestamp) {
        output.push(obj)
        continue
      }

      current = moment(obj.clientTimestamp)

      if (lastTime) {
        const secondsDiff = (
          current.valueOf() - lastTime.valueOf()
        ) / 1000
        const signAsNumber = Math.sign(secondsDiff)
        let sign = ''
        switch (signAsNumber) {
          case 1:
          case 0:
            sign = '+'
            break
          case -1:
          case -0:
            sign = '-'
        }
        output.push(R.assoc('relativeTiming', '' + sign + Math.abs(secondsDiff), obj))
      } else {
        output.push(R.assoc('relativeTiming', '+0.00', obj))
      }
      lastTime = current
    }
    return output
  },

  /**
   * Return a copy of the data with updated 'inputs' and 'audit' arrays that have relativeTiming added
   * @param check
   * @return {f2|f1}
   */
  addRelativeTimings: function addRelativeTimings (check) {
    const r1 = R.assoc('inputs', this.addRelativeTimingsToSection(check.inputs), check)
    return R.assoc('audit', this.addRelativeTimingsToSection(check.audit), r1)
  },

  /**
   * Gets the payload
   * @param checkCode
   * @return {Promise<{}>}
   */
  getPayload: async function getPayload (checkCode) {
    if (!checkCode) {
      throw new Error('Missing checkCode')
    }

    const p = await payloadDataService.sqlFindOneByCheckCode(checkCode)

    if (!p) {
      throw new Error('Not found')
    }

    return this.addRelativeTimings(p)
  }
}

module.exports = payloadService
