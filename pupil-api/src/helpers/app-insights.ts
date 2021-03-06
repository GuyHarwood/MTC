import * as appInsights from 'applicationinsights'
import PingController from '../controllers/ping.controller'

const appInsightsHelper = {
  startInsightsIfConfigured: async () => {
    if (process.env.APPINSIGHTS_INSTRUMENTATIONKEY) {
      appInsights.setup()
        .setAutoDependencyCorrelation(true)
        .setAutoCollectRequests(true)
        .setAutoCollectPerformance(true)
        .setAutoCollectExceptions(false)
        .setAutoCollectDependencies(true)
        .setAutoCollectConsole(false)
        .setUseDiskRetryCaching(true)
        .start()

      let buildNumber
      try {
        buildNumber = await PingController.getBuildNumber()
      } catch (error) {
        buildNumber = 'NOT FOUND'
      }
      appInsights.defaultClient.commonProperties = {
        buildNumber
      }
    }
  }
}

export = appInsightsHelper
