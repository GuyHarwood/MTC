'use strict'
const R = require('ramda')
const moment = require('moment')
const useragent = require('useragent')

const anomalyReportCacheDataService = require('./data-service/anomaly-report-cache.data.service')
const dateService = require('./date.service')
const psUtilService = require('./psychometrician-util.service')
const psychometricianDataService = require('./data-service/psychometrician.data.service')

const anomalyReportService = {}
anomalyReportService.reportedAnomalies = []

/**
 * Generate batched cached anomalies
 * @param {Number[]} batchIds - array of check IDs
 * @param logger - function context.log
 * @return {Array}
 */
anomalyReportService.batchProduceCacheData = async (batchIds, logger) => {
  anomalyReportService.reportedAnomalies = []

  const checksWithForms = await psychometricianDataService.sqlFindChecksByIdsWithForms(batchIds)

  if (!checksWithForms || !Array.isArray(checksWithForms) || !checksWithForms.length) {
    throw new Error('Failed to find any checks')
  }

  checksWithForms.forEach(checkWithForm => {
    anomalyReportService.detectAnomalies(checkWithForm, logger)
  })

  if (anomalyReportService.reportedAnomalies.length > 0) {
    try {
      await anomalyReportCacheDataService.sqlInsertMany(anomalyReportService.reportedAnomalies)
    } catch (error) {
      logger.error('ERROR: anomalyReportService.batchProduceCacheData: ' + error.message)
      throw error
    }
  }
}

/**
 * Push report data to the reported anomalies, from the populated check object
 * @param {Object} check
 * @param {String} message
 * @param {String} testedValue
 * @param {String} expectedValue
 * @param {String} questionNumber
 */
anomalyReportService.produceReportData = (check, message, testedValue = null, expectedValue = null, questionNumber = null) => {
  const agent = useragent.lookup(R.path(['data', 'device', 'navigator', 'userAgent'], check))
  const checkDate = anomalyReportService.getCheckDate(check)

  const reportData = {
    CheckCode: check.checkCode,
    Date: checkDate,
    'Speech Synthesis': check.data.config.speechSynthesis,
    Mark: `${check.mark} out of ${check.maxMark}`,
    Device: agent.device.toString().replace('0.0.0', ''),
    Agent: agent.toString(),
    Message: message,
    'Tested Value': testedValue,
    'Expected Value': expectedValue,
    'Question number': questionNumber
  }

  anomalyReportService.reportedAnomalies.push({ check_id: check.id, jsonData: reportData })
}

anomalyReportService.detectAnomalies = (check, logger) => {
  try {
    anomalyReportService.detectWrongNumberOfAnswers(check)
  } catch (error) {
    logger.error(`Failed check 1: ${check.checkCode} : ${error.message}`)
  }

  try {
    anomalyReportService.detectAnswersCorrespondToQuestions(check)
  } catch (error) {
    logger.error(`Failed check 2: ${check.checkCode} : ${error.message}`)
  }

  try {
    anomalyReportService.detectPageRefresh(check)
  } catch (error) {
    logger.error(`Failed check 3: ${check.checkCode} : ${error.message}`)
  }

  try {
    anomalyReportService.detectInputBeforeOrAfterTheQuestionIsShown(check)
  } catch (error) {
    logger.error(`Failed check 4: ${check.checkCode} : ${error.message}`)
  }

  try {
    anomalyReportService.detectMissingAudits(check)
  } catch (error) {
    logger.error(`Failed check 5: ${check.checkCode} : ${error.message}`)
  }

  try {
    anomalyReportService.detectChecksThatTookLongerThanTheTheoreticalMax(check)
  } catch (error) {
    logger.error(`Failed check 6: ${check.checkCode} : ${error.message}`)
  }

  try {
    anomalyReportService.detectInputThatDoesNotCorrespondToAnswers(check)
  } catch (error) {
    logger.error(`Failed check 7: ${check.checkCode} : ${error.message}`)
  }

  try {
    anomalyReportService.detectQuestionsThatWereShownForTooLong(check)
  } catch (error) {
    logger.error(`Failed check 8: ${check.checkCode} : ${error.message}`)
  }

  try {
    anomalyReportService.detectInputsWithoutQuestionInformation(check)
  } catch (error) {
    logger.error(`Failed check 9: ${check.checkCode} : ${error.message}`)
  }

  try {
    anomalyReportService.detectApplicationErrors(check)
  } catch (error) {
    logger.error(`Failed check 10: ${check.checkCode} : ${error.message}`)
  }

  // Navigator checks
  try {
    anomalyReportService.detectLowBattery(check)
  } catch (error) {
    logger.error(`Failed check 11: ${check.checkCode} : ${error.message}`)
  }

  try {
    anomalyReportService.detectInsufficientVerticalHeight(check)
  } catch (error) {
    logger.error(`Failed check 12: ${check.checkCode} : ${error.message}`)
  }

  try {
    anomalyReportService.detectLowColourDisplays(check)
  } catch (error) {
    logger.error(`Failed check 13: ${check.checkCode} : ${error.message}`)
  }
}

anomalyReportService.detectWrongNumberOfAnswers = (check) => {
  const numberOfQuestions = check.data.questions.length
  const numberOfAnswers = check.data.answers.length
  if (numberOfAnswers !== numberOfQuestions) {
    anomalyReportService.produceReportData(check, 'Wrong number of answers', numberOfAnswers, numberOfQuestions)
  }
}

anomalyReportService.detectPageRefresh = (check) => {
  let pageRefreshCount = 0
  const audits = R.pathOr([], ['data', 'audit'], check)
  audits.forEach(entry => {
    if (entry.type === 'RefreshDetected') {
      pageRefreshCount += 1
    }
  })
  if (pageRefreshCount) {
    anomalyReportService.produceReportData(check, 'Page refresh detected', pageRefreshCount, 0)
  }
}

anomalyReportService.detectLowBattery = (check) => {
  const battery = R.path(['data', 'device', 'battery'], check)
  if (!battery) { return }
  if (battery.levelPercent < 20 && !battery.isCharging) {
    anomalyReportService.produceReportData(check, 'Low battery', '' + battery.levelPercent + '%' + ' charging ' + battery.isCharging, '> 20%')
  }
}

anomalyReportService.filterInputsForQuestion = (questionNumber, factor1, factor2, inputs) => {
  const filteredInputs = R.filter(
    i => i.sequenceNumber === questionNumber &&
      i.question === `${factor1}x${factor2}`,
    inputs)
  return filteredInputs
}

anomalyReportService.detectInputBeforeOrAfterTheQuestionIsShown = (check) => {
  // For each question we need to check that the inputs were not
  // received before the question was shown, or after the question
  // should have been closed.
  const questions = check.data.questions
  questions.forEach(question => {
    const audits = R.pathOr([], ['data', 'audit'], check)
    const questionRenderedEvent = audits.find(e => e.type === 'QuestionRendered' && e.data && e.data.sequenceNumber === question.order)
    if (!questionRenderedEvent) {
      return anomalyReportService.produceReportData(check, 'QuestionRenderedEvent not found', null, null, `Q${question.order}`)
    }
    const questionShownAt = moment(questionRenderedEvent.clientTimestamp)
    if (!questionShownAt.isValid()) {
      return anomalyReportService.produceReportData(check, 'QuestionRendered Timestamp is not valid', questionRenderedEvent.clientTimestamp, 'Valid ts')
    }
    // If there are any inputs before `questionShownAt` it's an anomaly
    const inputs = anomalyReportService.filterInputsForQuestion(question.order, question.factor1, question.factor2, R.pathOr([], ['data', 'inputs'], check))
    if (!inputs) {
      return
    }

    const questionTimeLimit = check.data.config.questionTime
    const questionCutoffAt = questionShownAt.clone()
    // Add a small tolerance to inputs received after the question time limit, to allow for slower hardware
    questionCutoffAt.add(questionTimeLimit * 1.05, 'seconds')

    // Check the inputs to make sure they all the right question property
    inputs.forEach(input => {
      const inputTimeStamp = moment(input.clientTimestamp)
      if (inputTimeStamp.isBefore(questionShownAt)) {
        anomalyReportService.produceReportData(check, 'Input received before Question shown', input.clientTimestamp, questionRenderedEvent.clientTimestamp, `Q${question.order}`)
      }
      // We shouldn't have any input after the QuestionRendered ts + the question time-limit
      if (inputTimeStamp.isAfter(questionCutoffAt)) {
        anomalyReportService.produceReportData(check, 'Input received after cut-off', input.clientTimestamp, dateService.formatIso8601(questionCutoffAt), `Q${question.order}`)
      }
    })
  })
}

anomalyReportService.detectMissingAudits = (check) => {
  // We expect to see a QuestionRendered and a PauseRendered event for each Question
  const numberOfQuestions = check.data.questions.length
  const audits = R.pathOr([], ['data', 'audit'], check)
  if (audits.length === 0) {
    // no audits at all?  How could this happen?
    anomalyReportService.produceReportData(check, 'Data error: no audits found')
    return
  }
  const questionRenderedAudits = audits.filter(audit => audit.type === 'QuestionRendered')
  const numberOfPractiseQuestions = 3
  if (questionRenderedAudits.length !== numberOfQuestions + numberOfPractiseQuestions) {
    anomalyReportService.produceReportData(check, 'Wrong number of QuestionRendered audits', questionRenderedAudits.length, numberOfQuestions + numberOfPractiseQuestions)
  }

  const pauseRenderedAudits = audits.filter(audit => audit.type === 'PauseRendered')
  if (pauseRenderedAudits.length !== numberOfQuestions + numberOfPractiseQuestions) {
    anomalyReportService.produceReportData(check, 'Wrong number of PauseRendered audits', pauseRenderedAudits.length, numberOfQuestions + numberOfPractiseQuestions)
  }

  const detectMissingSingleAudit = function (auditType) {
    // Detect events that should occur only once
    const audits = R.pathOr([], ['data', 'audit'], check)
    const audit = audits.find(audit => audit.type === auditType)
    if (!audit) {
      anomalyReportService.produceReportData(check, `Missing audit ${auditType}`)
    }
  }
  const singleMandatoryAuditEvents = [
    'WarmupStarted',
    'WarmupIntroRendered',
    'WarmupCompleteRendered',
    'CheckStarted',
    'CheckStartedApiCalled',
    'CheckSubmissionPending'
  ]

  singleMandatoryAuditEvents.map(arg => detectMissingSingleAudit(arg))
}

anomalyReportService.detectInputsWithoutQuestionInformation = (check) => {
  const inputs = check.data.inputs
  if (!inputs) { return }

  const eventsMissingInformation = inputs.filter(e => {
    if (!e) { return false }
    const sequenceNumber = parseInt(e.sequenceNumber)
    if (sequenceNumber === -1 || isNaN(sequenceNumber)) {
      return true
    }
    return false
  })
  if (eventsMissingInformation.length) {
    anomalyReportService.produceReportData(check, 'One or more Input events missing question information', eventsMissingInformation.length, 0)
  }
}

anomalyReportService.detectInsufficientVerticalHeight = (check) => {
  const height = R.path(['data', 'device', 'screen', 'innerHeight'], check)
  const width = R.path(['data', 'device', 'screen', 'innerWidth'], check) || R.path(['data', 'device', 'screen', 'innerWith'], check)

  // The vertical height required depends on the width, as we have 3 breakpoints
  if (width <= 640 && height < 558) {
    anomalyReportService.produceReportData(check, 'Insufficient browser vertical height', height, '> 558 pixels')
  } else if (width > 640 && width <= 769 && height < 700) {
    anomalyReportService.produceReportData(check, 'Insufficient browser vertical height', height, '> 700 pixels')
  } else if (width > 769 && height < 660) {
    anomalyReportService.produceReportData(check, 'Insufficient browser vertical height', height, '> 660 pixels')
  }
}

anomalyReportService.detectLowColourDisplays = (check) => {
  const colourDepth = R.path(['data', 'device', 'screen', 'colorDepth'], check)
  if (colourDepth < 24) {
    anomalyReportService.produceReportData(check, 'Low colour display', colourDepth, '24')
  }
}

anomalyReportService.detectChecksThatTookLongerThanTheTheoreticalMax = (check) => {
  const numberOfQuestions = check.data.questions.length
  const config = check.data.config

  // Calculate the max total time allowed for the check
  const maxCheckSeconds = (numberOfQuestions * config.loadingTime) +
    (numberOfQuestions * config.questionTime) +
    (config.speechSynthesis ? numberOfQuestions * 2.5 : 0)

  // Calculate the time the check actually took
  const checkStart = psUtilService.getClientTimestampFromAuditEvent('CheckStarted', check)
  const checkComplete = psUtilService.getClientTimestampFromAuditEvent('CheckSubmissionPending', check)
  if (!checkStart || !checkComplete) {
    return anomalyReportService.produceReportData(check, 'Missing audit event ' + (checkStart ? 'CheckStarted' : 'CheckSubmissionPending'))
  }
  if (checkStart === 'error' || checkComplete === 'error') {
    return anomalyReportService.produceReportData(check, 'Timestamp error ' + (checkStart === 'error' ? 'CheckStarted' : 'CheckSubmissionPending'))
  }
  const checkStartDate = moment(checkStart)
  const checkCompleteDate = moment(checkComplete)
  if (!checkStartDate.isValid()) {
    return anomalyReportService.produceReportData(check, 'Invalid CheckStarted date', checkStart)
  }
  if (!checkCompleteDate.isValid()) {
    return anomalyReportService.produceReportData(check, 'Invalid CheckSubmissionPending date', checkComplete)
  }
  const totalCheckSeconds = checkCompleteDate.diff(checkStartDate, 'seconds')
  if (totalCheckSeconds > maxCheckSeconds) {
    anomalyReportService.produceReportData(check, 'Check took too long', totalCheckSeconds, maxCheckSeconds)
  }
}

anomalyReportService.detectInputThatDoesNotCorrespondToAnswers = (check) => {
  check.data.answers.forEach((answer, idx) => {
    const questionNumber = idx + 1
    const inputs = anomalyReportService.filterInputsForQuestion(questionNumber, answer.factor1, answer.factor2, check.data.inputs)
    const answerFromInputs = anomalyReportService.reconstructAnswerFromInputs(inputs)
    // The answer only stores the first 5 inputs, so there is no point in comparing more
    // characters (the inputs stores all the characters entered)
    if (answer.answer.substring(0, 5) !== answerFromInputs.substring(0, 5)) {
      anomalyReportService.produceReportData(check, 'Answer from inputs captured does not equal given answer', answerFromInputs, answer.answer, `Q${idx + 1}`)
    }
  })
}

anomalyReportService.detectAnswersCorrespondToQuestions = (check) => {
  const answerFactors = check.data.answers.map(answer => ({ f1: answer.factor1, f2: answer.factor2 }))
  const difference = R.difference(answerFactors, check.formData)
  if (difference.length > 0) {
    anomalyReportService.produceReportData(check, 'Answers factors do not correspond to the questions factors', difference.length, 0)
  }
}

anomalyReportService.reconstructAnswerFromInputs = (events) => {
  let ans = ''
  if (!Array.isArray(events)) {
    return ans
  }
  events.forEach(event => {
    if (event === null || event === undefined) {
      return
    }
    if (event.eventType !== 'click' && event.eventType !== 'keydown') {
      return
    }
    const upper = event.input.toUpperCase()
    if (upper === 'ENTER') {
      return
    }
    if (upper === 'BACKSPACE' || upper === 'DELETE' || upper === 'DEL') {
      if (ans.length > 0) {
        ans = ans.substr(0, ans.length - 1)
      }
    } else if (event.input.match(/^[0-9]$/)) {
      ans += event.input
    }
  })
  return ans
}

anomalyReportService.getCheckDate = (check) => {
  const checkStart = psUtilService.getClientTimestampFromAuditEvent('CheckStarted', check)
  let checkDate = ''

  if (checkStart && checkStart !== 'error') {
    const checkStartDate = moment(checkStart)
    checkDate = checkStartDate.isValid() ? dateService.formatUKDate(checkStartDate) : ''
  }
  return checkDate
}

anomalyReportService.addRelativeTimings = (elems) => {
  let lastTime, current
  for (const elem of elems) {
    if (!elem) {
      continue
    }

    if (!elem.clientTimestamp) {
      continue
    }

    current = moment(elem.clientTimestamp)
    if (lastTime) {
      const secondsDiff = (
        current.valueOf() - lastTime.valueOf()
      ) / 1000
      elem.relativeTiming = secondsDiff
    } else {
      elem.relativeTiming = 0
    }
    lastTime = current
  }
}

anomalyReportService.detectQuestionsThatWereShownForTooLong = (check) => {
  const audits = anomalyReportService.filterAllRealQuestionsAndPauseAudits(check)
  const config = check.data.config
  const head = R.head(audits)
  if (!head) {
    return
  }
  const tail = R.tail(audits)
  if (head.type !== 'PauseRendered') {
    return
  }
  // Add relative timings to each of the elements
  anomalyReportService.addRelativeTimings(audits)
  // Expected question time: allow a 5% tolerance for computer processing, and 2.5s for the speech to be read out (if configured)
  // NB: ticket 20864 will replace the 2.5 seconds with something accurate
  const expectedValue = (config.questionTime * 1.05) + (config.speechSynthesis ? 2.5 : 0)

  // To pick up the question number we have to look at the QuestionRendered event and no the following
  // pause event.
  let questionNumber

  for (const audit of tail) {
    if (audit.type === 'QuestionRendered') {
      questionNumber = R.path(['data', 'sequenceNumber'], audit)
    }
    // We detect the relative timing of the pause, as the relative timing of anomalyReportService.shows the time the question was shown
    if (audit.type === 'PauseRendered' && audit.relativeTiming > expectedValue) {
      anomalyReportService.produceReportData(check, 'Question may have been shown for too long', audit.relativeTiming, expectedValue, questionNumber)
    }
  }
}

anomalyReportService.detectApplicationErrors = (check) => {
  const audits = R.pathOr([], ['data', 'audit'], check)
  const appErrors = audits.filter(c => c.type === 'AppError')
  if (appErrors.length) {
    anomalyReportService.produceReportData(check, 'Check has Application Errors', appErrors.length, 0)
  }
}

anomalyReportService.filterAllRealQuestionsAndPauseAudits = (check) => {
  let hasCheckStarted = false
  const output = []
  const audits = R.pathOr([], ['data', 'audit'], check)
  for (const audit of audits) {
    if (audit.type === 'CheckStarted') {
      hasCheckStarted = true
    }
    if (!hasCheckStarted) {
      // Don't filter practise questions
      continue
    }
    if (audit.type !== 'QuestionRendered' && audit.type !== 'PauseRendered') {
      continue
    }
    output.push(audit)
  }
  return output
}

module.exports = anomalyReportService
