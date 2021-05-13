import { Client } from 'postmark'

import { POSTMARK_SERVER_TOKEN, ARTSFLOW_WEBSITE_URL } from './config'

const client = new Client(POSTMARK_SERVER_TOKEN)

interface Props {
  id: string
  title: string
  name: string
  email: string
}

const FROM_EMAIL = 'hello@artsflow.com'

export const notifyAddActivity = ({ id, title, name, email }: Props) => {
  sendEmail(email, 'add-activity', {
    name,
    activity_title: title,
    activity_url: `${ARTSFLOW_WEBSITE_URL}/a/${id}`,
  })
}

export const notifyNewCreativeSignup = ({ name, email }: { name: string; email: string }) => {
  sendEmail(email, 'new-creative', { name })
}

export const notifyCreativeVerified = ({ name, email }: { name: string; email: string }) => {
  sendEmail(email, 'verified-creative', { name })
}

const sendEmail = (to: string, templateAlias: string, templateModel: any) => {
  client.sendEmailWithTemplate({
    From: FROM_EMAIL,
    To: to,
    TemplateAlias: templateAlias,
    TemplateModel: templateModel,
  })
}
