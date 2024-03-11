import type { Request, Response } from "express"
import type { Pool } from "mysql2/promise"

export class Healthcare {
    private pingPool: Pool

    constructor({ pingPool }: { pingPool: Pool }) {
        this.pingPool = pingPool
    }

    checkApi = (_req: Request, res: Response) => {    
        res.status(200).send('pong')      
    }

    checkDatabase = async (_req: Request, res: Response) => {
        const connection = await this.pingPool.getConnection()
        
        try {
            await connection.query('SELECT 1')
            res.status(200).send('pong')      
            
        } catch(err) {
            res.status(500).send(`Database connection error (${err})`)
    
        } finally {
            connection.release()
    
        }
    }
}