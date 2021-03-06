'use strict'

const logger = require('../services/log.service').getLogger()
const rolesConfig = require('../roles-config')
const config = require('../config')

const home = (req, res) => {
  if (req.isAuthenticated()) {
    switch (req.user.role) {
      case 'TEACHER':
      case 'HEADTEACHER':
        return res.redirect(rolesConfig.HOME_TEACHER)
      case 'TEST-DEVELOPER':
        return res.redirect(rolesConfig.HOME_TEST_DEVELOPER)
      case 'SERVICE-MANAGER':
        return res.redirect(rolesConfig.HOME_SERVICE_MANAGER)
    }
  } else {
    res.redirect('/sign-in')
  }
}

const getSignIn = (req, res) => {
  res.locals.pageTitle = 'Check Development - Login'
  if (req.isAuthenticated()) {
    res.redirect('/school/school-home')
  } else {
    if (config.NCA_TOOLS_AUTH_URL) {
      res.redirect(config.NCA_TOOLS_AUTH_URL)
    } else {
      res.render('sign-in', { layout: 'gds-layout' })
    }
  }
}

const postSignIn = (req, res) => {
  // Only id is available from local and NCA auth
  const { displayName, id, role, timezone } = req.user
  logger.info(`postSignIn: User ID logged in: ${id} (${displayName}) timezone is "${timezone}"`)

  switch (role) {
    case 'TEACHER':
    case 'HEADTEACHER':
      return res.redirect(rolesConfig.HOME_TEACHER)
    case 'TEST-DEVELOPER':
      return res.redirect(rolesConfig.HOME_TEST_DEVELOPER)
    case 'SERVICE-MANAGER':
      return res.redirect(rolesConfig.HOME_SERVICE_MANAGER)
    default:
      return res.redirect(rolesConfig.HOME_TEACHER)
  }
}

const getSignOut = (req, res) => {
  req.logout()
  req.session.regenerate(function () {
    // session has been regenerated
    if (config.NCA_TOOLS_AUTH_URL && config.NCA_TOOLS_AUTH_URL.length > 0) {
      res.redirect(config.NCA_TOOLS_AUTH_URL)
    } else {
      res.redirect('/')
    }
  })
}

const getSignInFailure = (req, res) => {
  res.locals.pageTitle = 'Check Development App - Sign-in error'
  res.render('sign-in-failure', { layout: 'gds-layout' })
}

const postAuth = (req, res) => {
  // Please leave this in until we are confident we have identified all the NCA Tools roles.
  logger.debug('postAuth() executing postAuth for user in role:', req.user.role)
  // Schools roles should redirect to school-home:
  // no mapping provided yet.
  return res.redirect(rolesConfig.HOME_TEACHER)
}

const getUnauthorised = (req, res) => {
  if (config.NCA_TOOLS_AUTH_URL && config.NCA_TOOLS_AUTH_URL.length > 0) {
    res.redirect(config.NCA_TOOLS_AUTH_URL)
  } else {
    res.locals.pageTitle = 'Access Unauthorised'
    res.render('unauthorised')
  }
}

module.exports = {
  home,
  getSignIn,
  postSignIn,
  getSignOut,
  getSignInFailure,
  postAuth,
  getUnauthorised
}
