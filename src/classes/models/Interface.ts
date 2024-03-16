import { writeFile } from "fs-extra"

type MethodsArgs = { fieldsObject: Record<string, string[]>, routeName: string }
type WriteArgs = { fieldsObject: Record<string, string[]>, routeName: string, writePath: string }

export class InterfaceFile {

    constructor() {}

    private capitalizeFirstLetter(word: string) {
        return word.charAt(0).toUpperCase() + word.slice(1)
    }

    private generateInterface({ fieldsObject, routeName }: MethodsArgs) {

        let generatedCode = ''
        const RouteName = this.capitalizeFirstLetter(routeName)

        for (const functionName in fieldsObject) {
            const parameters = fieldsObject[functionName].join(', ')
            const parameterTypes = `${RouteName}Type['${functionName}']`
            const parameterObject = parameters ? `{ ${parameters} }: ${parameterTypes}` : ''
            const returnType = functionName.includes('get') ? 'RowDataPacket[]' : 'ResultSetHeader'

            generatedCode += (
                `   ${functionName}(${parameterObject}): Promise<${returnType}>\n`
            ) 
        }

        return (
            `import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';\n` +
            `import type ${RouteName}Type from '../types/methods';\n\n` +

            `interface I${RouteName} {\n` +
            `${generatedCode}` +
            `};\n\n` +

            `export default I${RouteName};`
        )
    }

    async writeInterfaceFile({ routeName, fieldsObject, writePath }: WriteArgs) {

        const content = this.generateInterface({ routeName, fieldsObject })

        await writeFile(writePath, content, 'utf-8')
            .catch(err => { throw new Error(err) })
    }
}