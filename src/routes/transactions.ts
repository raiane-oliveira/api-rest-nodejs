import { randomUUID } from 'crypto'
import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function transactionsRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (req) => {
      const { sessionId } = req.cookies

      const transactions = await knex('transactions')
        .where('session_id', sessionId)
        .select()

      return {
        transactions,
      }
    },
  )

  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (req) => {
      const getTransactionParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getTransactionParamsSchema.parse(req.params)
      const { sessionId } = req.cookies

      const transaction = await knex('transactions')
        .select()
        .where({
          id,
          session_id: sessionId,
        })
        .first() // se não usarmos o método first, transaction será um array

      return {
        transaction,
      }
    },
  )

  app.get(
    '/summary',
    {
      preHandler: [checkSessionIdExists],
    },
    async (req) => {
      const { sessionId } = req.cookies

      const summary = await knex('transactions')
        .sum('amount', {
          as: 'amount',
        })
        .where('session_id', sessionId)
        .first()

      return {
        summary,
      }
    },
  )

  app.post('/', async (req, res) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    })

    const { title, amount, type } = createTransactionBodySchema.parse(req.body)

    let { sessionId } = req.cookies

    if (!sessionId) {
      sessionId = randomUUID()

      res.cookie('sessionId', randomUUID(), {
        path: '/',
        maxAge: 60 * 60 * 7, // 7 days
      })
    }

    await knex
      .insert({
        id: randomUUID(),
        title,
        amount: type === 'credit' ? amount : amount * -1,
        session_id: sessionId,
      })
      .into('transactions')

    return res.status(201).send('Transaction created with successful!')
  })
}
