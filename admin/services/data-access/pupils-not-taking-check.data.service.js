'use strict'

const sqlService = require('./sql.service')
const { TYPES } = require('./sql.service')

const pupilsNotTakingCheckDataService = {
/**
 * @param {number} schoolId
 * @description returns all pupils with specified school that have a record of attendance
 * @returns {Promise.<*>}
 */
  sqlFindPupilsWithReasons: async (schoolId) => {
    const sql = `
      SELECT p.*, ac.reason
      FROM [mtc_admin].[pupil] p
        INNER JOIN [mtc_admin].[pupilAttendance] pa ON p.id = pa.pupil_id
        INNER JOIN [mtc_admin].[attendanceCode] ac ON pa.attendanceCode_id = ac.id
      WHERE p.school_id = @schoolId AND pa.isDeleted = 0
      ORDER BY p.lastName ASC, p.foreName ASC, p.middleNames ASC, p.dateOfBirth ASC
    `

    const params = [{
      name: 'schoolId',
      value: schoolId,
      type: TYPES.Int
    }]

    return sqlService.query(sql, params)
  },

  /**
   * @param {number} schoolId
   * @description returns all pupils with specified school that don't have a record of attendance
   * @returns {Promise.<*>}
   */
  sqlFindPupilsWithoutReasons: async (schoolId) => {
    const sql = `
    SELECT
    p.foreName,
    p.middleNames,
    p.lastName,
    p.dateOfBirth,
    p.urlSlug,
    p.group_id
  FROM [mtc_admin].[pupil] p
  JOIN [mtc_admin].pupilStatus ps ON ps.id = p.pupilStatus_id
  LEFT JOIN [mtc_admin].[pupilAttendance] pa ON p.id = pa.pupil_id AND pa.isDeleted=0
  WHERE p.school_id = @schoolId
  AND ps.code = 'UNALLOC'
  AND pa.id IS NULL
  ORDER BY p.lastName ASC, p.foreName ASC, p.middleNames ASC, p.dateOfBirth ASC
    `
    const params = [{
      name: 'schoolId',
      value: schoolId,
      type: TYPES.Int
    }]

    return sqlService.query(sql, params)
  },

  /**
   * @param {Array} pupilIds
   * @description returns all pupils that are included in the list and have a record of attendance
   * @returns {Promise.<*>}
   */
  sqlFindPupilsWithReasonByIds: async (pupilIds) => {
    const select = `
      SELECT p.id, ac.reason
      FROM [mtc_admin].[pupil] p
        INNER JOIN [mtc_admin].[pupilAttendance] pa ON p.id = pa.pupil_id
        INNER JOIN [mtc_admin].[attendanceCode] ac ON pa.attendanceCode_id = ac.id
      `

    const where = sqlService.buildParameterList(pupilIds, TYPES.Int)
    const sql = [select, 'WHERE pa.isDeleted = 0 AND p.id IN (', where.paramIdentifiers.join(', '), ')'].join(' ')
    return sqlService.query(sql, where.params)
  }
}

module.exports = pupilsNotTakingCheckDataService
