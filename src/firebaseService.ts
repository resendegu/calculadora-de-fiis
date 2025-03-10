import { db } from './firebase-config'
import { ref, set } from 'firebase/database'

export type Save = {
  name: string
  dividendGoal: string
  funds: {
    id: number
    name: string
    dividend: string
    price: string
  }[]
}

export async function uploadSaves(saves: Save[]): Promise<void> {
  try {
    await set(ref(db, 'saves'), saves)
    console.log('Saves uploaded successfully.')
  } catch (error) {
    console.error('Error uploading saves:', error)
    throw error
  }
}
