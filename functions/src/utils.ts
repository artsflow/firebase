import { customAlphabet } from 'nanoid'

const alphabet = 'abcdefghijklmnopqrstuvwxyz1234567890'

export const nanoid = customAlphabet(alphabet, 8)
