import express from "express"
import cors from "cors"
import bodyParser from "body-parser"
import { prisma } from "../prisma/prisma.js"

const PORT = 3000
const app = express()

app.use(cors(), bodyParser.json())

app.get('/', (_, res) => { return res.json({ "Hello": "There" }) })

app.post('/create-order', async (req, res) => {

    const { storeId, order, amount } = req.body

    if (typeof storeId !== 'number' || typeof amount !== 'number' || typeof order !== 'object' ||
      typeof storeId === null || typeof storeId === undefined ||
        typeof amount === null || typeof amount === undefined ||
          typeof order === null || typeof order === undefined)
        return res.json({ status: 500 })

    const { id } = await prisma.transaction.create({
        data: {
            storeId,
            order,
            amount
        }
    })

    return res.json({ tid: id })
})

app.delete('/delete-order', async (req, res) => {

    const { tid } = req.body

    if (typeof tid !== 'string' || typeof tid === null || typeof tid === undefined)
        return res.json({ status: 500 })

    const data = await prisma.transaction.deleteMany({
        where: { id: tid },
    })

    return res.json(data)
})

app.post('/place-order', async (req,res) => {

    // Get user details
    const {uid, pin, tid, amount} = req.body

    if (typeof uid !== 'string' || typeof amount !== 'number' || typeof pin !== 'string' || typeof tid !== 'string' ||
      typeof uid === null || typeof uid === undefined ||
        typeof amount === null || typeof amount === undefined ||
          typeof pin === null || typeof pin === undefined ||
            typeof tid === null || typeof tid === undefined)
        return res.json({ status: 500 })

    // Check if the uid exists
    const user = await prisma.user.findUnique({
        where: {
            id: uid,
        }
    })

    if (!user || pin !== user.pin || amount > user.balance) 
        return res.json({ status: 500 })

    // Perform transaction
    const setUser = async (uid, tid) => {
        await prisma.transaction.update({
            where: { id: tid },
            data: { uid },
        })
    }

    const updateBalance = async (uid, balance) => {
        await prisma.user.update({
            where: { id: uid },
            data: { balance }
        })
    }

    await setUser(uid, tid)
    await updateBalance(uid, user.balance - amount)

    return res.json({ status: 200 })
})

app.listen(PORT, () => {
    console.log("LISTENING ON PORT " + PORT)
})

export default app
