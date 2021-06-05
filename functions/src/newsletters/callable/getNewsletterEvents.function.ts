import * as functions from 'firebase-functions'

import { BigQuery } from '@google-cloud/bigquery'

import { admin } from '../../config'

export const getNewsletterEvents = functions
  .region('europe-west2')
  .https.onCall(async (data, context) => {
    const userId = context.auth?.uid as any

    if (data.warmup) {
      return { success: true }
    }

    if (!userId) return false

    const bigquery = new BigQuery()

    const projectId = admin.instanceId().app.options.projectId

    const query = `
      SELECT
        timestamp,
        record_type,
        recipient,
        suppress_sending,
        suppression_reason
      FROM
        \`${projectId}.dashboard.newsletter_events\`
      WHERE
        newsletter_id = '${data.newsletterId}'
      AND 
        record_type != 'Bounce'
      ORDER BY
        timestamp DESC
      LIMIT
        1000
      `

    try {
      const result = await bigquery.dataset('dashboard').table('newsletter_events').query({ query })
      return result
    } catch (e) {
      functions.logger.error(JSON.stringify(e))
      return e
    }
  })
