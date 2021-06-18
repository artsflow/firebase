import * as functions from 'firebase-functions'
import { BigQuery } from '@google-cloud/bigquery'

import { admin } from '../../config'

export const getActivityViews = functions
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
      DATE(timestamp) AS date,
      COUNT(*) AS count
    FROM
      \`${projectId}.dashboard.activity_views\`
    WHERE
      DATE(timestamp) BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
      AND CURRENT_DATE()
      AND creativeId = '${userId}'
    GROUP BY
      date
    ORDER BY
      date DESC 
        `

    try {
      const result = await bigquery.dataset('dashboard').table('activity_views').query({ query })
      return result
    } catch (e) {
      functions.logger.error(JSON.stringify(e))
      return e
    }
  })
