import { pathExists, writeFile } from "fs-extra"

type TemplateArgs = { methods: string, routeName: string }
type MethodsArgs = { fieldsObject: Record<string, string[]>, routeName: string }
type CheckArgs = { tablePath: string, methodsPath: string }
type WriteArgs = CheckArgs & MethodsArgs & { writePath: string }

export class ModelFile {

    constructor() {}

    private capitalizeFirstLetter(word: string) {
        return word.charAt(0).toUpperCase() + word.slice(1)
    }

    private addTemplate({ methods, routeName }: TemplateArgs) {

        const RouteName = this.capitalizeFirstLetter(routeName)

        return (
        `import type { RowDataPacket, ResultSetHeader, Pool } from 'mysql2/promise'\n` +
        `import type ${RouteName}Type from '../types/methods'\n` +
        `import ${routeName}Queries from '../helpers/queries'\n\n` +

        `class ${RouteName} {\n` +
        `    private pool\n\n` +
            
        `    constructor({ ${routeName}Pool }: { ${routeName}Pool: Pool }) {\n` +
        `        this.pool = ${routeName}Pool\n` +
        `    }\n\n` +
        
        `${methods}` +
        `}\n\n` +

        `export default ${RouteName}`
        )
    }

    private addMethods({ fieldsObject, routeName }: MethodsArgs) {

        let generatedCode = ''
        const RouteName = this.capitalizeFirstLetter(routeName)

        for (const functionName in fieldsObject) {
            const parameters = fieldsObject[functionName].join(', ')
            const parameterTypes = `${RouteName}Type['${functionName}']`
            const returnType = functionName.includes('get') ? 'RowDataPacket[]' : 'ResultSetHeader'

            generatedCode += (
                `    ${functionName} = async ({ ${parameters} }: ${parameterTypes}) => {\n` +
                `        const connection = await this.pool.getConnection()\n\n` +

                `        const [rows] = await connection.execute(\n` +
                `           ${routeName}Queries.${functionName},\n` +
                `           [${parameters}]\n` +
                `        )\n\n` +

                `        connection.release()\n` +
                `        return rows as ${returnType}\n` +
                `    }\n\n`
            ) 
        }

        return generatedCode
    }

    private async checkPaths({ tablePath, methodsPath }: CheckArgs) {
        const isTableFile = await pathExists(tablePath)
            .catch(err => { throw new Error(err) })

        const isMethodsFile = await pathExists(methodsPath)
            .catch(err => { throw new Error(err) })

        if(!isTableFile && !isMethodsFile) return false
        else return true
    }

    async writeModelFile({ fieldsObject, tablePath, methodsPath, routeName, writePath }: WriteArgs) {
        if(!this.checkPaths({ tablePath, methodsPath })) return 

        const methods = this.addMethods({ fieldsObject, routeName })
        const content = this.addTemplate({ methods, routeName })

        await writeFile(writePath, content, 'utf-8')
            .catch(err => { throw new Error(err) })
    }
}