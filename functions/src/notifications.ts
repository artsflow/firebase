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
  client.sendEmailWithTemplate({
    From: FROM_EMAIL,
    To: email,
    TemplateAlias: 'add-activity',
    TemplateModel: {
      name,
      activity_title: title,
      activity_url: `${ARTSFLOW_WEBSITE_URL}/a/${id}`,
    },
  })
}
