import * as admin from 'firebase-admin'
admin.initializeApp()

const db = admin.firestore()

if (process.env.FUNCTIONS_EMULATOR) {
  console.info('running on emulator')
  db.settings({ host: 'localhost:9042', ssl: false })
}

export { db, admin }
