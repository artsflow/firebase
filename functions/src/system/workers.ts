import { notifyUserScheduledBooking, UserScheduledBookingProps } from '../notifications'
import { db, serverTimestamp } from '../config'

interface Workers {
  [key: string]: (options: any) => Promise<any>
}

export const workers: Workers = {
  notifyUserScheduledBooking: (options: UserScheduledBookingProps) => {
    notifyUserScheduledBooking(options)
    return Promise.resolve(true)
  },
}

export const scheduleTask = ({ performAt, worker, options }: any) =>
  db
    .collection('tasks')
    .add({ createdAt: serverTimestamp(), performAt, status: 'scheduled', worker, options })
