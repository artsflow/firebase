import * as functions from 'firebase-functions'
import { BigQuery } from '@google-cloud/bigquery'

export const activityPageViewsToBigQuery = functions
  .region('europe-west2')
  .pubsub.topic('activity-page')
  .onPublish(async (message) => {
    const messageBody = message.data ? Buffer.from(message.data, 'base64').toString() : null

    if (!messageBody) return

    const data = JSON.parse(messageBody)
    // functions.logger.info(data)

    const { userId, properties, context, event } = data

    if (event !== 'Activity Page Viewed') return

    const { activityId, creativeId } = properties
    const { ip, page, userAgent } = context
    const { search, referrer } = page

    const row = {
      timestamp: BigQuery.timestamp(new Date()),
      activityId,
      creativeId,
      userId,
      ip,
      referrer,
      search,
      userAgent,
    }

    const bigquery = new BigQuery()
    try {
      await bigquery.dataset('dashboard').table('activity_views').insert(row)
    } catch (e) {
      functions.logger.error(JSON.stringify(e))
    }
  })
