import createApp from './routes/app'
import { PORT, ENVIRONMENT } from './utils/config'
import { createPoolConnection } from './services/database'

const pingPool = createPoolConnection({
    waitForConnection: true, 
    connectionLimit: 1, 
    queueLimit: 0
})

const app = createApp({ pingPool })

const server = app.listen(PORT[ENVIRONMENT], () => {
    console.log(`Server running on Port: ${PORT[ENVIRONMENT]}`)
})

export { app, server, pingPool }