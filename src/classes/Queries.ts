import { readFile, writeFile } from 'fs-extra'
import { basename, extname } from 'path'

export class QueriesOperations {
    data: Record<string, string>
    tableName: string
    private content: string

    constructor() {
        this.data = {}
        this.content = ''
        this.tableName = ''
    }

    private async processSQL(fileText: string) {
        const newData: Record<string, string> = {}
        const lines = fileText.split('\n')

        let currentQuery = ''
        let currentComment = ''

        for (const line of lines) {
            const cleanLine = line.trim()
    
            if (cleanLine.startsWith('--')) {
                currentComment = cleanLine.slice(2).trim()
            } else if (cleanLine !== '') {
                if (currentComment !== '') currentQuery += cleanLine + ' '
            } else if (currentComment !== '' && currentQuery.trim() !== '') {
                newData[currentComment] = currentQuery
                currentComment = ''
                currentQuery = ''
            }
        }

        this.data = newData
    }

    private generateContent(tableName: string) {
        const typeInterface = `export interface ${tableName}Interface {\n${Object.keys(this.data).map(queryName => `  ${queryName}: string;`).join('\n')}\n}\n\n`
        const queryObject = `const ${tableName}Queries: ${tableName}Interface = ${JSON.stringify(this.data, null, 2)};\n\nexport default ${tableName}Queries;`

        this.content = typeInterface + queryObject
    }

    async writeQueryFile(readPath: string, writePath: string) {
        const sqlContent = await readFile(readPath, 'utf-8')
            .catch(err => { throw new Error(err) })

        this.processSQL(sqlContent)

        const tableName = basename(readPath, extname(readPath))

        this.tableName = tableName
        this.generateContent(tableName)

        await writeFile(writePath, this.content, 'utf-8')
            .catch(err => { throw new Error(err) })
    }
}