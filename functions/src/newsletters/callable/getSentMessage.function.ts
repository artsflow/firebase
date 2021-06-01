import * as functions from 'firebase-functions'
import { ServerClient } from 'postmark'

import { POSTMARK_SERVER_TOKEN } from '../../config'

export const getSentMessage = functions
  .region('europe-west2')
  .https.onCall(async (data, context) => {
    const userId = context.auth?.uid as any

    if (data.warmup) {
      return { success: true }
    }

    if (!userId) return false

    const client = new ServerClient(POSTMARK_SERVER_TOKEN)

    return client.getOutboundMessageDetails(data)
  })
