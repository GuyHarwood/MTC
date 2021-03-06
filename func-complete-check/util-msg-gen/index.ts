/// <reference path="../typings/message-schemas.ts" />
import { AzureFunction, Context, HttpRequest } from '@azure/functions'
import * as lz from 'lz-string'
import uuid from 'uuid/v4'
import * as checkMessage from '../messages/complete-check-message-template.json'
import * as largeCompleteCheck from '../messages/large-complete-check.json'

const httpTrigger: AzureFunction = function (context: Context, req: HttpRequest): void {
  const message = JSON.parse(JSON.stringify(checkMessage))
  message.checkCode = uuid()
  message.schoolUUID = uuid()
  // enable to create an invalid check
  // delete largeCompleteCheck.answers
  const archive = lz.compressToUTF16(JSON.stringify(largeCompleteCheck))
  message.archive = archive
  context.bindings.submittedCheckQueue = [ message ]
  context.done()
}

export default httpTrigger
