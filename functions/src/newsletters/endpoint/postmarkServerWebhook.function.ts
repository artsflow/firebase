import * as functions from 'firebase-functions'
import { BigQuery } from '@google-cloud/bigquery'

import { POSTMARK_WEBHOOK_TOKEN } from '../../config'

export const postmarkServerWebhook = functions
  .region('europe-west2')
  .https.onRequest(async (request, response) => {
    if (request.headers.token !== POSTMARK_WEBHOOK_TOKEN) {
      response.status(401).send({ ok: false })
      return
    }

    functions.logger.info(request.body)

    const {
      RecordType,
      MessageID,
      Recipient,
      Email,
      Metadata,
      SuppressSending,
      SuppressionReason,
    } = request.body

    const recipient = RecordType === 'Bounce' || RecordType === 'SpamComplaint' ? Email : Recipient

    const row = {
      timestamp: BigQuery.timestamp(new Date()),
      record_type: RecordType,
      message_id: MessageID,
      recipient,
      newsletter_id: Metadata.newsletterId,
      user_id: Metadata.userId,
      event: JSON.stringify(request.body),
      suppress_sending: SuppressSending,
      suppression_reason: SuppressionReason,
    }

    const bigquery = new BigQuery()

    try {
      await bigquery.dataset('dashboard').table('newsletter_events').insert(row)
      response.status(200).send({ ok: true })
    } catch (e) {
      functions.logger.error(JSON.stringify(e))
      response.status(500).send({ ok: false })
    }
  })
