import { pathExists, readFile, writeFile } from "fs-extra"

type ValidationArgs = { fieldsContent: string, routeName: string }
type WriteArgs = { routeName: string, readPath: string, writePath: string }

export class ValidationFile {

    constructor() {}

    private capitalizeFirstLetter(word: string) {
        return word.charAt(0).toUpperCase() + word.slice(1)
    }

    private generateZodMethods({ routeName, fieldsContent }: ValidationArgs) {

        const matches = [...fieldsContent.matchAll(/"([^"]+)"\s*:\s*\[([^\]]+)\]/g)]

        const classBody = matches.map(match => {
            const methodName = match[1]
            const fields = match[2].split(',').filter((item) => item.trim().length > 0)
            const fieldString = `{ ${fields.map(field => `${field.trim()}: true`).join(', ')} }`

            return `    ${methodName} = (data: unknown) => ${routeName}TableSchema.pick(${fieldString}).safeParse(data)\n`
        }).join('')

        return classBody
    }

    private generateValidaton({ routeName, fieldsContent }: ValidationArgs) {
        const RouteName = this.capitalizeFirstLetter(routeName)
        
        const classMethod = this.generateZodMethods({ routeName, fieldsContent })

        return (
            `import ${routeName}TableSchema from '../schema/object';\n\n` +

            `class ${RouteName}Validation {\n` +
            `${classMethod}` +
            `};\n\n` +

            `export default ${RouteName}Validation;`
        )
    }

    async writeValidationFile({ routeName, readPath, writePath }: WriteArgs) {
        
        const isFieldsFile = await pathExists(readPath)
            .catch(err => { throw new Error(err) })

        if(isFieldsFile) {
            const fieldsContent = await readFile(readPath, 'utf-8')
                .catch(err => { throw new Error(err) })

            const content = this.generateValidaton({ routeName, fieldsContent })            

            await writeFile(writePath, content, 'utf-8')
                .catch(err => { throw new Error(err) })
        }
    }
}