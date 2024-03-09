import { readFile, writeFile } from 'fs-extra'
import { TYPES_MAP, isValidType } from '../config/typesMap'

interface ColumnInfo {
    name: string
    type: string
    constraint?: string
}

export class TypesOperations {

    constructor() {}    

    private camelCase(str: string) {
        return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    }

    private getTypescriptTypes(sqlType: string, constraint: string) {

        const match = sqlType.match(/(\w+)(?:\((\d+)\))?/)

        if(!match) return 'any'
    
        const baseType = match[1].toUpperCase()
        const tsType = isValidType(baseType) ? TYPES_MAP[baseType] : 'any'
        const isNotNull = constraint ? constraint.includes('NOT NULL') : false
        const isAutoIncrement = constraint ? constraint.includes('AUTO_INCREMENT') : false
    
        if(isNotNull || isAutoIncrement) return tsType
        return tsType + ' | null'
    }

    private parseTableContent(tableContent: string): ColumnInfo[] {
        const columnRegex = /`(\w+)`\s+(\w+(?:\(\d+\))?)\s+(NOT NULL|AUTO_INCREMENT|DEFAULT \S+)?/;
        const columnsMatch = tableContent.match(new RegExp(columnRegex, 'g'))
    
        if (!columnsMatch) return []
        
        return columnsMatch.map(column => {
            const matchResult = column.match(columnRegex)
    
            if (matchResult && matchResult.length >= 4) {
                const [, name, type, constraint] = matchResult as [string, string, string, string]
                return { name, type, constraint }
            } else {
                console.error(`No match found for column ${column}.`)
                return { name: '', type: '', constraint: '' }
            }
        })
    }

    private getTypeScriptContent(tableName: string, columns: ColumnInfo[]) {

        return `type ${this.camelCase(tableName)} = {\n${columns.map(column => {
            if(!column.type || !column.constraint) return
            
            const tsType = this.getTypescriptTypes(column.type, column.constraint)
            return `   ${column.name}: ${tsType}`
            
        }).join('\n')}\n};\n\nexport default ${this.camelCase(tableName)};`
    }

    async writeTablesFile(readPath: string, writePath: string) {
        const sqlContent = await readFile(readPath, 'utf-8')
            .catch(err => { throw new Error(err) })

        const tableRegex = /CREATE TABLE `(\w+)` \(([\s\S]*?)\);/g
        const matches = Array.from(sqlContent.matchAll(tableRegex))

        for (const match of matches) {
            const tableName = match[1]
            const tableContent = match[2]

            const columns = this.parseTableContent(tableContent)

            if (columns.length === 0) return

            const content = this.getTypeScriptContent(tableName, columns)
            
            await writeFile(writePath, content, 'utf-8')
                .catch(err => { throw new Error(err) })
        }
    }    
}
