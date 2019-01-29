'use strict'

const R = require('ramda')

const schoolDataService = require('../services/data-access/school.data.service')
const pupilStatusService = require('../services/pupil.status.service')
const pupilDataService = require('../services/data-access/pupil.data.service')
const attendanceCodeDataService = require('./data-access/attendance-code.data.service')
const pupilAttendanceDataService = require('../services/data-access/pupil-attendance.data.service')
const headteacherDeclarationDataService = require('./data-access/headteacher-declaration.data.service')
const headteacherDeclarationService = {}

/**
 * Find the pupils for the given dfe number
 * @param dfeNumber
 * @return {Promise<object>}
 */
headteacherDeclarationService.findPupilsForSchool = async (dfeNumber) => {
  if (!dfeNumber) {
    throw new Error('dfeNumber is required')
  }
  return pupilDataService.sqlFindPupilsWithStatusAndAttendanceReasons(dfeNumber)
}

/**
 * Find the a pupil for the given pupilId and dfeNumber
 * @param pupilId
 * @param dfeNumber
 * @return {Promise<object>}
 */
headteacherDeclarationService.findPupilByIdAndDfeNumber = async (pupilId, dfeNumber) => {
  if (!dfeNumber || !pupilId) {
    throw new Error('pupilId and dfeNumber are required')
  }
  const school = await schoolDataService.sqlFindOneByDfeNumber(dfeNumber)
  if (!school) {
    throw new Error(`School [${dfeNumber}] not found`)
  }
  return pupilDataService.sqlFindOneWithAttendanceReasonsByIdAndSchool(pupilId, school.id)
}

/**
 * Fetch pupils and return eligibility to generate HDF
 * @param dfeNumber
 * @returns {Array}
 */
headteacherDeclarationService.getEligibilityForSchool = async (dfeNumber) => {
  const pupils = await pupilDataService.sqlFindPupilsWithStatusByDfeNumber(dfeNumber)
  // check the attendance codes for pupils that don't have the completed status
  const ids = pupils.filter(p => p.code !== pupilStatusService.STATUS_CODES.COMPLETED).map(p => p.id)
  if (ids.length === 0) {
    return true
  }
  const pupilAttendance = await pupilAttendanceDataService.findByPupilIds(ids)
  // check if all pupils that don't have the completed status, have an attendance reason
  return pupilAttendance.length === ids.length
}

/**
 * Declare the results of the check, to be used by the Headteacher or equivalent role
 * This is the personal sign-off from the head, and closes the check for their school.
 * @param {object} form
 * @param {number} dfeNumber
 * @return {Promise<void>}
 */
headteacherDeclarationService.declare = async (form, dfeNumber, userId) => {
  const school = await schoolDataService.sqlFindOneByDfeNumber(dfeNumber)

  if (!school) {
    throw new Error(`school ${dfeNumber} not found`)
  }

  const data = R.clone(form)

  data.signedDate = new Date()
  data.school_id = school.id
  data.user_id = userId

  // Add the check window they are signing for
  // TODO: data-refactor: update this once the checkwindow refactoring is done.
  data.checkWindow_id = 1

  await headteacherDeclarationDataService.sqlCreate(data)

  // TODO: hdf: close the check for the school?
}

/**
 * Return the last HDF submitted for a school, using DfeNumber
 * @param {number} dfeNumber
 * @return {Promise<void>}
 */
headteacherDeclarationService.findLatestHdfForSchool = async (dfeNumber) => {
  // TODO: hdf: role checks? Date checks?

  const school = await schoolDataService.sqlFindOneByDfeNumber(dfeNumber)
  if (!school) {
    return null
  }
  return headteacherDeclarationDataService.sqlFindLatestHdfBySchoolId(school.id)
}

/**
 * Returns true if we are in a check window and the hdf has already been submitted
 * False if we are not in a check window
 * False if we are in a check window and it has not been submitted
 * @param dfeNumber
 * @return {Promise<boolean>}
 */
headteacherDeclarationService.isHdfSubmittedForCurrentCheck = async (dfeNumber) => {
  const hdf = await headteacherDeclarationDataService.findCurrentHdfForSchool(dfeNumber)
  if (!hdf) {
    return false
  }
  if (!hdf.signedDate) {
    return false
  }
  return true
}

/**
 * Updates a pupils attendance code
 * @param pupilIds
 * @param code
 * @param userId
 * @return {Promise<object>}
 */
headteacherDeclarationService.updatePupilsAttendanceCode = async (pupilIds, code, userId) => {
  if (!pupilIds || !code || !userId) {
    throw new Error('pupilIds, code and userId are required')
  }
  const attendanceCode = await attendanceCodeDataService.sqlFindOneAttendanceCodeByCode(code)
  if (!attendanceCode) {
    throw new Error(`attendanceCode not found: ${code}`)
  }
  return pupilAttendanceDataService.sqlUpdateBatch(pupilIds, attendanceCode.id, userId)
}

module.exports = headteacherDeclarationService
