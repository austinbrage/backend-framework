import { pathExists, readFile, writeFile } from "fs-extra"

type AsignArgs = { fieldsObject: string | null, tableTypes: Record<string, string> }
type WriteArgs = { fieldsPath: string, tablePath: string, writePath: string }
type WriteArgs1 = { fieldsPath: string, tableContent: string, writePath: string }
type WriteArgs2 = { fieldsContent: string, tablePath: string, writePath: string }

export class MethodsFile {

    constructor() {}

    private capitalizeFirstLetter(word: string) {
        return word.charAt(0).toUpperCase() + word.slice(1)
    }

    private createFieldTypes(fieldContent: string) {
        const match = fieldContent.match(/const\s+(\w+)\s*=\s*\{/)
        
        if (!match) return null

        const typeName = match[1]

        const completedType = fieldContent
            .replace(`const ${typeName}`, `type I${this.capitalizeFirstLetter(typeName)}`)
            .replace(`default ${typeName}`, `default I${this.capitalizeFirstLetter(typeName)}`)
            .replace(`${typeName} =`, '')
            .replace(/"/g, '')
            .replace(/],/g, ']')   
            .replace(/\[/g, '{')
            .replace(/\]/g, ': any}')
            .replace(/,/g, ': any')  
            .replace(/\s+: /g, ': ')
            .replace(/: any}/g, ': any \n  }')
            .replace(/Fields/g, 'Methods')

        return completedType
    }

    private createTableObject (tableContent: string) {
        const matches = [...tableContent.matchAll(/(\w+): (\w+)( \| null)?/g)]

        const properties: Record<string, string> = {}

        matches.map(match => {
            const propertyName = match[1]
            const propertyType = match[2]
            const propertyNull = match[3]

            if(!propertyNull) return properties[propertyName] = propertyType
            return properties[propertyName] = propertyType + propertyNull
        })

        return properties
    }

    private asignCorrectType({ fieldsObject, tableTypes }: AsignArgs) {
        const lines = fieldsObject?.split('\n')  ?? null
        
        if(lines === null) return

        lines.forEach((line, index) => {
            const propMatch = line.match(/(\w+): any/)
    
            if (propMatch && tableTypes[propMatch[1]]) {
                const propertyName = propMatch[1]
                const propertyType = tableTypes[propertyName]
                lines[index] = line.replace(/any/g, propertyType)
            }
        })

        return lines.join('\n')
    }

    async writeMethodsFile1({ fieldsPath, tableContent, writePath }: WriteArgs1) {
        
        const isFieldsFile = await pathExists(fieldsPath)
            .catch(err => { throw new Error(err) })

        if(isFieldsFile) {
            const fieldsContent = await readFile(fieldsPath, 'utf-8')
                .catch(err => { throw new Error(err) })
            
            const tableTypes = this.createTableObject(tableContent)
            const fieldsObject = this.createFieldTypes(fieldsContent)
    
            const content = this.asignCorrectType({ fieldsObject, tableTypes }) ?? ''
    
            await writeFile(writePath, content, 'utf-8')
                .catch(err => { throw new Error(err) })
        }
    }

    async writeMethodsFile2({ fieldsContent, tablePath, writePath }: WriteArgs2) {
        
        const isTableFile = await pathExists(tablePath)
            .catch(err => { throw new Error(err) })

        if(isTableFile) {
            const tableContent = await readFile(tablePath, 'utf-8')
            .catch(err => { throw new Error(err) })
            
            const tableTypes = this.createTableObject(tableContent)
            const fieldsObject = this.createFieldTypes(fieldsContent)
    
            const content = this.asignCorrectType({ fieldsObject, tableTypes }) ?? ''
    
            await writeFile(writePath, content, 'utf-8')
                .catch(err => { throw new Error(err) })
        }
    }
}
