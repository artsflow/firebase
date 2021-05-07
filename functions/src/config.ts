import Stripe from 'stripe'
import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'

admin.initializeApp()

const FieldValue = admin.firestore.FieldValue
export const serverTimestamp = FieldValue.serverTimestamp

const db = admin.firestore()

let key = functions.config().stripe.prod

let ARTSFLOW_APP_URL = functions.config().artsflow.app_url
let STRIPE_WEBHOOK_SECRET = functions.config().stripe.webhook

if (process.env.FUNCTIONS_EMULATOR) {
  console.info('running on emulator')
  key = functions.config().stripe.dev
  db.settings({ host: 'localhost:9042', ssl: false })
  ARTSFLOW_APP_URL = 'http://localhost:4042'
  STRIPE_WEBHOOK_SECRET = 'whsec_P9UQMXuEvGavuxKbjTxyB2xpcCHltuYq'
}

export const stripe = new Stripe(key, { apiVersion: '2020-08-27' })

export const ARTSFLOW_FEE = 10

export { db, admin, ARTSFLOW_APP_URL, STRIPE_WEBHOOK_SECRET }
