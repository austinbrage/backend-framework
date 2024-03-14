import { writeFile } from 'fs-extra'

type WriteArgs = { writePath: string, tableName: string, queries: Record<string, string> }

export class FieldsFile {
    private insertRegex
    private regularRegex

    constructor() {
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

    async writeFieldsFile({ writePath, tableName, queries }: WriteArgs) {
        const newFields: Record<string, string[]> = {}

        for (const key in queries) {
            if (queries[key] !== undefined) {
                const query = queries[key]
                const fields = this.getFieldsFromQuery(query)
                if(fields.length > 0) newFields[key] = fields
            }
        }

        const fieldsObject = `const ${tableName}Fields = ${JSON.stringify(newFields, null, 2)};\n\nexport default ${tableName}Fields;`

        await writeFile(writePath, fieldsObject, 'utf-8')
            .catch(err => { throw new Error(err) })

        return { fieldsObject, newFields }
    }
}