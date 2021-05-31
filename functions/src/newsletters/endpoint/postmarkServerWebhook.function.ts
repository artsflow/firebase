import * as functions from 'firebase-functions'

// import { getDocument } from '../../utils'
import { POSTMARK_WEBHOOK_TOKEN } from '../../config'

export const postmarkServerWebhook = functions
  .region('europe-west2')
  .https.onRequest(async (request, response) => {
    if (request.headers.token !== POSTMARK_WEBHOOK_TOKEN) {
      response.status(401).send({ ok: false })
      return
    }

    functions.logger.info(request.body)

    response.status(200).send({ ok: true })
  })
