import { readFile, writeFile } from 'fs-extra'

type WriteArgs = { readPath: string, writePath: string, tableName: string }

export class QueriesFile {
    queries: Record<string, string>
    private content: string

    constructor() {
        this.queries = {}
        this.content = ''
    }

    private capitalizeFirstLetter(word: string) {
        return word.charAt(0).toUpperCase() + word.slice(1)
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

        this.queries = newData
    }

    private generateContent(tableName: string) {
        const typeInterface = `export interface I${this.capitalizeFirstLetter(tableName + 'Queries')} {\n${Object.keys(this.queries).map(queryName => `  ${queryName}: string;`).join('\n')}\n}\n\n`
        const queryObject = `const ${tableName}Queries: I${this.capitalizeFirstLetter(tableName + 'Queries')} = ${JSON.stringify(this.queries, null, 2)};\n\nexport default ${tableName}Queries;`

        this.content = typeInterface + queryObject
    }

    async writeQueriesFile({ readPath, writePath, tableName }: WriteArgs) {
        const sqlContent = await readFile(readPath, 'utf-8')
            .catch(err => { throw new Error(err) })

        this.processSQL(sqlContent)
        this.generateContent(tableName)

        await writeFile(writePath, this.content, 'utf-8')
            .catch(err => { throw new Error(err) })

        return this.queries
    }
}