import { writeFile } from 'fs-extra'
import { QueriesOperations } from './Queries'

export class ArgumentOperations extends QueriesOperations {
    private insertRegex
    private regularRegex

    constructor() {
        super()
        this.insertRegex = /INSERT INTO `[^`]+` \(([^)]+)\)/
        this.regularRegex = /`(\w+)` = \?/g
    }

    private getFieldsFromQuery(query: string) {
        const insertMatch = query.match(this.insertRegex)
        const regularMatch = query.matchAll(this.regularRegex)

        if(insertMatch) return insertMatch[1].split(',').map(field => {
            return field.trim().replace(/`/g, '')
        })

        return Array.from(regularMatch, match => match[1])
    }

    async writeArgumentFile(writePath: string) {
        const newArguments: Record<string, string[]> = {}

        for (const key in this.data) {
            if (this.data.hasOwnProperty(key)) {
                const query = this.data[key]
                const fields = this.getFieldsFromQuery(query)
                newArguments[key] = fields
            }
        }

        const argumentsString = `const ${this.tableName}Fields = ${JSON.stringify(newArguments, null, 2)};\n\nexport default ${this.tableName}Fields`

        await writeFile(writePath, argumentsString, 'utf-8')
            .catch(err => { throw new Error(err) })
    }
}