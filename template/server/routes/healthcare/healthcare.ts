import { Router } from 'express'
import { Healthcare as HealthcareController } from './controller/Healthcare' 
import { type Pool } from 'mysql2/promise'

const createHealthcareRouter = ({ pingPool }: { pingPool: Pool }) => {

    const healthcareRouter = Router()
    const healthcareController = new HealthcareController({ pingPool })
    
    healthcareRouter.get('/api', healthcareController.checkApi)
    healthcareRouter.get('/database', healthcareController.checkDatabase)

    return healthcareRouter
}

export default createHealthcareRouter