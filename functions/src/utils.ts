import * as functions from 'firebase-functions'
import Stripe from 'stripe'
import { customAlphabet } from 'nanoid'
import { AccountClient, ServerClient, Models } from 'postmark'

import { admin, db, stripe, POSTMARK_ACCOUNT_TOKEN, POSTMARK_WEBHOOK_TOKEN } from './config'

const alphabet = 'abcdefghijklmnopqrstuvwxyz1234567890'

export const nanoid = customAlphabet(alphabet, 8)

export const getStripeAccount = async (userId: string) => {
  const { data } = await getDocument(userId, 'users')
  const { stripeAccountId } = data

  if (!stripeAccountId) return null

  return await stripe.accounts.retrieve(stripeAccountId)
}

export const getOrCreateStripeCustomer = async (userId: string, params?: any) => {
  const { data, snapshot } = await getDocument(userId, 'users')
  const { stripeCustomerId, email, displayName } = data
  const { name, phone } = params

  const updatedName = displayName !== name ? name : displayName

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email,
      name: updatedName,
      phone,
      metadata: {
        firebaseUID: userId,
      },
      ...params,
    })
    await snapshot.ref.update({
      stripeCustomerId: customer.id,
      displayName: updatedName,
    })
    return customer
  } else {
    return (await stripe.customers.retrieve(stripeCustomerId)) as Stripe.Customer
  }
}

export const getDocument = async (id: string, collection: string) => {
  const snapshot = await db.collection(collection).doc(id).get()
  const data = snapshot.data() as any
  return { data: { ...data, id }, snapshot }
}

export const isEmailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export const setupPostmarkServer = async (userId: string): Promise<string> => {
  const projectId = admin.instanceId().app.options.projectId
  const accountClient = new AccountClient(POSTMARK_ACCOUNT_TOKEN)

  try {
    const server = await accountClient.createServer({
      Name: userId,
      Color: 'purple',
      TrackOpens: true,
      TrackLinks: Models.LinkTrackingOptions.HtmlAndText,
    })

    const token = server.ApiTokens[0]
    const serverId = server.ID

    const serverClient = new ServerClient(token)

    await serverClient.createMessageStream({
      Name: 'newsletter',
      ID: 'newsletter',
      MessageStreamType: 'Broadcasts',
    })

    await serverClient.createWebhook({
      Url: `https://europe-west2-${projectId}.cloudfunctions.net/postmarkServerWebhook`,
      HttpHeaders: [{ Name: 'token', Value: POSTMARK_WEBHOOK_TOKEN }],
      MessageStream: 'newsletter',
      Triggers: {
        Delivery: {
          Enabled: true,
        },
        Bounce: {
          Enabled: true,
          IncludeContent: false,
        },
        SpamComplaint: {
          Enabled: true,
          IncludeContent: false,
        },
        Open: {
          Enabled: true,
          PostFirstOpenOnly: true,
        },
        Click: {
          Enabled: true,
        },
        // @ts-ignore
        SubscriptionChange: {
          Enabled: true,
        },
      },
    })

    db.collection('postmark').doc(userId).set({ serverId, token })

    return token
  } catch (e) {
    functions.logger.error(JSON.stringify(e))
    return e
  }
}

export const getPostmarkServerToken = async (userId: string): Promise<string> => {
  const { data } = await getDocument(userId, 'postmark')

  if (!data?.token) {
    const token = await setupPostmarkServer(userId)
    return token
  }

  return data?.token
}
