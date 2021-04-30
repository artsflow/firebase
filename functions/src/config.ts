import Stripe from 'stripe'
import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'

admin.initializeApp()

const FieldValue = admin.firestore.FieldValue
export const serverTimestamp = FieldValue.serverTimestamp

const db = admin.firestore()

let key = functions.config().stripe.prod

let artsflowUrl = 'https://app.artsflow.com'

if (process.env.FUNCTIONS_EMULATOR) {
  console.info('running on emulator')
  key = functions.config().stripe.dev
  db.settings({ host: 'localhost:9042', ssl: false })
  artsflowUrl = 'http://localhost:4042'
}

export const stripe = new Stripe(key, { apiVersion: '2020-08-27' })

export const ARTSFLOW_FEE = 10

export const STRIPE_WEBHOOK_SECRET = 'whsec_P9UQMXuEvGavuxKbjTxyB2xpcCHltuYq'

export { db, admin, artsflowUrl }
