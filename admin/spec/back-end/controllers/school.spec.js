'use strict'

/* global describe beforeEach afterEach it expect jasmine spyOn */

const sinon = require('sinon')
const httpMocks = require('node-mocks-http')

const checkWindowV2Service = require('../../../services/check-window-v2.service')
const pupilRegisterService = require('../../../services/pupil-register.service')
const schoolController = require('../../../controllers/school')
const schoolService = require('../../../services/school.service')
const resultPageAvailabilityService = require('../../../services/results-page-availability.service')
const schoolHomeFeatureEligibilityPresenter = require('../../../helpers/school-home-feature-eligibility-presenter')
const schoolMock = require('../mocks/school')

describe('school controller:', () => {
  function getRes () {
    const res = httpMocks.createResponse()
    res.locals = {}
    return res
  }

  function getReq (params) {
    const req = httpMocks.createRequest(params)
    req.user = { School: 9991001 }
    req.breadcrumbs = jasmine.createSpy('breadcrumbs')
    req.flash = jasmine.createSpy('flash')
    return req
  }

  describe('Check routes', () => {
    let sandbox
    let next
    let goodReqParams = {
      method: 'GET',
      url: '/school/school-home'
    }

    beforeEach(() => {
      sandbox = sinon.createSandbox()
      next = jasmine.createSpy('next')
    })

    afterEach(() => {
      sandbox.restore()
    })

    describe('#getSchoolLandingPage', () => {
      it('should display the \'school landing page\'', async (done) => {
        spyOn(checkWindowV2Service, 'getActiveCheckWindow').and.returnValue({})
        spyOn(schoolHomeFeatureEligibilityPresenter, 'getPresentationData')
        spyOn(schoolService, 'findSchoolByDfeNumber').and.returnValue(schoolMock)
        spyOn(pupilRegisterService, 'hasIncompleteChecks').and.returnValue(false)
        spyOn(resultPageAvailabilityService, 'getResultsOpeningDate')
        spyOn(resultPageAvailabilityService, 'isResultsFeatureAccessible')
        const res = getRes()
        const req = getReq(goodReqParams)
        await schoolController.getSchoolLandingPage(req, res, next)
        expect(checkWindowV2Service.getActiveCheckWindow).toHaveBeenCalled()
        expect(schoolHomeFeatureEligibilityPresenter.getPresentationData).toHaveBeenCalled()
        expect(schoolService.findSchoolByDfeNumber).toHaveBeenCalled()
        expect(pupilRegisterService.hasIncompleteChecks).toHaveBeenCalled()
        expect(res.statusCode).toBe(200)
        expect(res.locals.pageTitle).toBe('School Homepage')
        expect(next).not.toHaveBeenCalled()
        done()
      })
      it('should throw an error if getActiveCheckWindow method throws an error', async () => {
        spyOn(checkWindowV2Service, 'getActiveCheckWindow').and.returnValue((Promise.reject(new Error('error'))))
        spyOn(schoolService, 'findSchoolByDfeNumber').and.returnValue(schoolMock)
        spyOn(schoolHomeFeatureEligibilityPresenter, 'getPresentationData')
        spyOn(pupilRegisterService, 'hasIncompleteChecks').and.returnValue(false)
        spyOn(resultPageAvailabilityService, 'getResultsOpeningDate')
        spyOn(resultPageAvailabilityService, 'isResultsFeatureAccessible')
        const res = getRes()
        const req = getReq(goodReqParams)
        await schoolController.getSchoolLandingPage(req, res, next)
        expect(checkWindowV2Service.getActiveCheckWindow).toHaveBeenCalled()
        expect(schoolService.findSchoolByDfeNumber).not.toHaveBeenCalled()
        expect(schoolHomeFeatureEligibilityPresenter.getPresentationData).not.toHaveBeenCalled()
        expect(pupilRegisterService.hasIncompleteChecks).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalled()
      })
    })
  })
})
