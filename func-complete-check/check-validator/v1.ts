import { Context } from '@azure/functions'
import { ValidateCheckMessageV1, ReceivedCheck, MarkCheckMessageV1 } from '../typings/message-schemas'
import Moment from 'moment'
import * as R from 'ramda'
import compressionService from '../lib/compression-service'
import azureStorageHelper from '../lib/azure-storage-helper'
const tableService = azureStorageHelper.getPromisifiedAzureTableService()
import checkSchema from '../messages/complete-check.v1.json'

class V1 {
  async process (context: Context, validateCheckMessage: ValidateCheckMessageV1) {
    let receivedCheck = findReceivedCheck(context.bindings.receivedCheckTable)
    try {
      detectArchive(receivedCheck)
      const decompressedString = compressionService.decompress(receivedCheck.archive)
      const checkData = JSON.parse(decompressedString)
      validateArchive(checkData, context)
    } catch (error) {
      await updateReceivedCheckWithErrorDetails(error.message, receivedCheck)
      context.log.error(error.message)
      return
    }
    await updateReceivedCheckWithValidationTimestamp(receivedCheck)
    // dispatch message to indicate ready for marking
    const markingMessage: MarkCheckMessageV1 = {
      schoolUUID: validateCheckMessage.schoolUUID,
      checkCode: validateCheckMessage.checkCode,
      version: '1'
    }

    context.bindings.checkMarkingQueue = [markingMessage]
  }
}
// TODO strongly type the inputs and outputs
function findReceivedCheck (receivedCheckRef: any) {
  if (!receivedCheckRef) {
    throw new Error('received check reference is undefined')
  }
  if (!Array.isArray(receivedCheckRef)) {
    throw new Error(`received check reference was not an array`)
  }
  if (receivedCheckRef.length === 0) {
    throw new Error('received check reference is empty')
  }
  return receivedCheckRef[0]
}

async function updateReceivedCheckWithValidationTimestamp (receivedCheck: ReceivedCheck) {
  receivedCheck.validatedAt = Moment().toDate()
  receivedCheck.isValid = true
  await tableService.replaceEntityAsync('receivedCheck', receivedCheck)
}

async function updateReceivedCheckWithErrorDetails (errorMessage: string, receivedCheck: ReceivedCheck) {
  receivedCheck.validationError = errorMessage
  receivedCheck.validatedAt = Moment().toDate()
  receivedCheck.isValid = false
  await tableService.replaceEntityAsync('receivedCheck', receivedCheck)
}

function detectArchive (message: object) {
  if (!message.hasOwnProperty('archive')) {
    throw new Error(`message is missing 'archive' property`)
  }
}

function validateArchive (check: object, context: Context) {
  // get top level properties of message schema as an array
  // @ts-ignore
  const allProperties = Object.getOwnPropertyNames(checkSchema)
  const requiredProperties = R.without(['version'], allProperties)
  for (let index = 0; index < requiredProperties.length; index++) {
    const propertyName = requiredProperties[index]
    context.log(`validating property ${propertyName}`)
    if (!check.hasOwnProperty(propertyName)) {
      throw new Error(`check is missing ${propertyName} property`)
    }
  }
}

export default new V1()
