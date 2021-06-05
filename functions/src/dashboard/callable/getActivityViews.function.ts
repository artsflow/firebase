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
        EXTRACT(DAY
        FROM
          timestamp) AS day,
        COUNT(1) AS count
      FROM
        \`${projectId}.dashboard.activity_views\`
      WHERE
        creativeId = '${userId}'
      GROUP BY
        day
      ORDER BY
        day ASC
      LIMIT
        7
      `

    try {
      const result = await bigquery.dataset('dashboard').table('activity_views').query({ query })
      return result
    } catch (e) {
      functions.logger.error(JSON.stringify(e))
      return e
    }
  })
