import { pathExists, readFile, writeFile } from "fs-extra"

type SchemaArgs = { tableContent: string, routeName: string }
type WriteArgs = { routeName: string, readPath: string, writePath: string }

export class SchemaFile {

    constructor() {}

    private generateZodType(line: string) {
        let zodType = ''
        
        const [propertyName, propertyType] = line.trim().split(':')
        
        if (propertyType.includes('|')) {
            const types = propertyType?.trim().split('|').map(type => {
                return type.includes('null')
                    ? 'z.null()'
                    : `z.${type?.trim()?.toLowerCase()}()`
            })
            zodType = `z.union([${types.join(', ')}])`
        } else {
            zodType = `z.${propertyType?.trim()?.toLowerCase()}()`
        }
        
        return `${propertyName?.trim()}: ${zodType},`
    }

    private generateSchema({ tableContent, routeName }: SchemaArgs) {
        const lines = tableContent.split('\n').slice(1, -2)

        const properties = lines
            .filter(line => line.includes(':'))
            .map(line => this.generateZodType(line))

        return (
            `import { z } from 'zod'\n\n` +

            `const ${routeName}TableSchema = z.object({\n` +
            `   ${properties.join('\n   ')}\n` +
            `});\n\n` +

            `export default ${routeName}TableSchema;`
        )
    }

    async writeSchemaFile({ routeName, readPath, writePath }: WriteArgs) {

        const isTableFile = await pathExists(readPath)
            .catch(err => { throw new Error(err) })

        if(isTableFile) {
            const tableContent = await readFile(readPath, 'utf-8')
                .catch(err => { throw new Error(err) })

            const content = this.generateSchema({ routeName, tableContent })            

            await writeFile(writePath, content, 'utf-8')
                .catch(err => { throw new Error(err) })
        }
    }
}