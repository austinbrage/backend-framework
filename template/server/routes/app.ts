import express, { json, Router }  from "express"
import { AppRoutes as APP, ResourceRoutes as RESOURCES } from "../types/api"
import corsMiddleware from "../middlewares/cors"
import errorMiddleware from "../middlewares/error"
import createHealthcareRouter from './healthcare/healthcare'
import { notFoundHandler } from "../services/notFoundHandler"
import { type Pool } from "mysql2/promise"

type App = {
    pingPool: Pool
}

const createApp = ({ pingPool }: App) => {
    const app = express()
    const mainRouter = Router()

    app.use(json())
    app.use(corsMiddleware())
    app.disable('x-powered-by')

    app.use(APP.VERSION_1, mainRouter)
    mainRouter.use(RESOURCES.PING, createHealthcareRouter({ pingPool }))

    app.all('*', notFoundHandler)
    app.use(errorMiddleware)

    return app
}

export default createApp