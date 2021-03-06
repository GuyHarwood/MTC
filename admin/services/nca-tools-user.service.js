'use strict'

const roleService = require('./role.service')
const schoolDataService = require('./data-access/school.data.service')
const userDataService = require('./data-access/user.data.service')
const { MtcHelpdeskImpersonationError } = require('../error-types/mtc-error')

const service = {
  /**
   * @description maps an authenticated NCA Tools user to an MTC user, school and role
   * @param {object} ncaUser all decrypted user information sent in the request payload
   */
  mapNcaUserToMtcUser: async (ncaUser) => {
    if (!ncaUser) {
      throw new Error('ncaUser argument required')
    }
    // TODO persist nca tools session token (best place might be adminLogonEvent?

    let school
    if (ncaUser.School) {
      school = await schoolDataService.sqlFindOneByDfeNumber(ncaUser.School)
    } else {
      throw new MtcHelpdeskImpersonationError('No DfE number provided by NCA tools')
    }

    let userRecord = await userDataService.sqlFindOneByIdentifier(ncaUser.externalAuthenticationId)
    if (!userRecord) {
      const mtcRoleName = roleService.mapNcaRoleToMtcRole(ncaUser.UserType, school)
      const role = await roleService.findByTitle(mtcRoleName)
      const user = {
        identifier: ncaUser.externalAuthenticationId,
        displayName: ncaUser.EmailAddress,
        role_id: role.id
      }
      if (school) {
        user.school_id = school.id
      }
      await userDataService.sqlCreate(user)
      userRecord = await userDataService.sqlFindOneByIdentifier(ncaUser.externalAuthenticationId)
      if (!userRecord) {
        throw new Error('unable to find user record')
      }
    } else {
      // user exists - check requested school
      if (school && (userRecord.school_id !== school.id)) {
        await userDataService.sqlUpdateSchool(userRecord.id, school.id)
        userRecord = await userDataService.sqlFindOneByIdentifier(ncaUser.externalAuthenticationId)
      }
    }
    userRecord.mtcRole = roleService.mapNcaRoleToMtcRole(ncaUser.UserType, school)
    return userRecord
  }
}

module.exports = service
