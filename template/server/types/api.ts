import { type ZodFormattedError } from "zod"
import { type RowDataPacket, ResultSetHeader } from "mysql2"

export enum AppRoutes {
    VERSION_1 = '/awesome-api'
}

export enum ResourceRoutes {
    PING = '/ping'
}

export type ErrorResponse = {
    success: false
    error: {
        status: 'fail' | 'error'
        message: string
        validationError: ZodFormattedError<unknown> | null
    }
}

export type OkResponse = {
    success: true
    result: {
        message: string
        token: string | null
        data: RowDataPacket[] | ResultSetHeader[] | null
    }
}

export type StardardResponse = OkResponse | ErrorResponse