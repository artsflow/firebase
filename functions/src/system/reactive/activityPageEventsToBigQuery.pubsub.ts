import * as functions from 'firebase-functions'
// import { BigQuery } from '@google-cloud/bigquery'

export const activityPageEventsToBigQuery = functions
  .region('europe-west2')
  .pubsub.topic('activity-page')
  .onPublish(async (message) => {
    const messageBody = message.data ? Buffer.from(message.data, 'base64').toString() : null

    if (!messageBody) return

    const data = JSON.parse(messageBody)
    functions.logger.info(data)

    // const bigquery = new BigQuery()

    // await bigquery.dataset('events').table('events').insert([data])
  })
