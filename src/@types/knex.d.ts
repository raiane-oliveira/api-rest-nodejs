// eslint-disable-next-line
import { Knex } from 'knex' // primeiro passo para sobrescrever a tipagem de alguma lib é importá-la

declare module 'knex/types/tables' {
  export interface Tables {
    transactions: {
      id: string
      title: string
      amount: number
      created_at: string
      session_id?: string
    }
  }
}
