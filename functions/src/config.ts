import Stripe from 'stripe'
import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'

admin.initializeApp()

const FieldValue = admin.firestore.FieldValue
export const serverTimestamp = FieldValue.serverTimestamp

const db = admin.firestore()

let key = functions.config().stripe.prod

let ARTSFLOW_APP_URL = functions.config().artsflow.app_url
let ARTSFLOW_WEBSITE_URL = functions.config().artsflow.website_url

let STRIPE_WEBHOOK_SECRET = functions.config().stripe.webhook
const STRIPE_WEBHOOK_SECRET_CONNECT = functions.config().stripe.webhook_connect

export const POSTMARK_ACCOUNT_TOKEN = functions.config().postmark.account_token
export const POSTMARK_SERVER_TOKEN = functions.config().postmark.server_token
export const POSTMARK_WEBHOOK_TOKEN = functions.config().postmark.webhook_token

export const SEGMENT_KEY = functions.config().segment.key

if (process.env.FUNCTIONS_EMULATOR) {
  console.info('running on emulator')
  key = functions.config().stripe.dev
  db.settings({ host: 'localhost:9042', ssl: false })
  ARTSFLOW_APP_URL = 'http://localhost:4042'
  STRIPE_WEBHOOK_SECRET = 'whsec_P9UQMXuEvGavuxKbjTxyB2xpcCHltuYq'
  ARTSFLOW_WEBSITE_URL = 'http://localhost:5042'
}

export const stripe = new Stripe(key, { apiVersion: '2020-08-27' })

export const ARTSFLOW_FEE = 10

export {
  db,
  admin,
  ARTSFLOW_APP_URL,
  ARTSFLOW_WEBSITE_URL,
  STRIPE_WEBHOOK_SECRET,
  STRIPE_WEBHOOK_SECRET_CONNECT,
}
