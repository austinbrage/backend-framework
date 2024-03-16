import createApp from './routes/app'
import { PORT, ENVIRONMENT } from './global/utils/config'
import { createPoolConnection } from './global/services/database'

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