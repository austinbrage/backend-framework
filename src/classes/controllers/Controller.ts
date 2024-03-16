import { pathExists, readFile, writeFile } from "fs-extra"

type ControllerArgs = { routeName: string, methods: string }
type MethodsArgs = { routeName: string, fieldsContent: string }
type WriteArgs = { routeName: string, readPath: string, writePath: string }

export class ControllerFile {

    constructor() {}

    private capitalizeFirstLetter(word: string) {
        return word.charAt(0).toUpperCase() + word.slice(1)
    }

    private generateMethods({ routeName, fieldsContent }: MethodsArgs) {
        
        const RouteName = this.capitalizeFirstLetter(routeName)

        const matches = [...fieldsContent.matchAll(/"([^"]+)":\s*\[([^\]]*)\]/g)]

        const classBody = matches.map(match => {
            const methodName = match[1]
            const fields = match[2].trim()

            const validationConst = fields 
                ? (
                    `        const validation = this.validate${RouteName}.${methodName}(req.body);\n\n` +
                    `        if (!validation.success) return this.validationErr(res, validation.error);\n\n`
                ) : ''
            const returnedData = methodName.includes('get') ? 'data' : 'data: [data]'
            const modelMethodCall = fields ? `validation.data` : ''
            const requestArgument = fields ? `req` : '_req'
            
            return (
                `    ${methodName} = asyncErrorHandler(async (${requestArgument}: Request, res: Response) => {\n` +
                        `${validationConst}` + 

                `        const data = await this.${routeName}Model.${methodName}(${modelMethodCall});\n\n` +

                `        return res.status(200).json(createOkResponse({\n` +
                `            message: '${methodName} in ${routeName} executed successfully',\n` +
                `            ${returnedData}\n` +
                `        }));\n` +
                `    })\n\n`
            )
        }).join('')

        return classBody
    }

    private generateController({ routeName, methods }: ControllerArgs) {

        const RouteName = this.capitalizeFirstLetter(routeName)
        
        return (
            `import ${RouteName}Validation from '../validation/validator';\n` +
            `import { asyncErrorHandler } from '../../../services/errorHandler';\n` +
            `import { createOkResponse, createErrorResponse } from '../../../helpers/appResponse';\n` +
            `import type { Request, Response } from 'express';\n` +
            `import type I${RouteName} from '../types/model';\n` +
            `import type { ZodError } from 'zod';\n\n` +

            `class ${RouteName}Controller {\n` +
            `    private validate${RouteName};\n` +
            `    private ${routeName}Model: I${RouteName};\n\n` +
            
            `    constructor({ ${routeName}Model }: { ${routeName}Model: I${RouteName} }) {\n` +
            `        this.${routeName}Model = ${routeName}Model;\n` +
            `        this.validate${RouteName} = new ${RouteName}Validation();\n` +
            `    }\n\n` +
            
            `    private validationErr(res: Response, validationError: ZodError<unknown>) {\n` +
            `        return res.status(400).json(createErrorResponse({\n` +
            `            message: 'Validation data error',\n` +
            `            error: validationError.format()\n` +
            `        }));\n` +
            `    }\n\n` +

            `${methods}` +

            `};\n\n` +

            `export default ${RouteName}Controller;`
        )
    }

    async writeValidationFile({ routeName, readPath, writePath }: WriteArgs) {
        
        const isFieldsFile = await pathExists(readPath)
            .catch(err => { throw new Error(err) })

        if(isFieldsFile) {
            const fieldsContent = await readFile(readPath, 'utf-8')
                .catch(err => { throw new Error(err) })

            const methods = this.generateMethods({ routeName, fieldsContent })
            const content = this.generateController({ routeName, methods })            

            await writeFile(writePath, content, 'utf-8')
                .catch(err => { throw new Error(err) })
        }
    }
}