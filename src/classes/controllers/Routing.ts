import { pathExists, readFile, writeFile } from "fs-extra"

type RoutingArgs = { fieldsContent: string, routeName: string }
type WriteArgs = { routeName: string, readPath: string, writePath: string }

export class RoutingFile {

    constructor() {}

    private capitalizeFirstLetter(word: string) {
        return word.charAt(0).toUpperCase() + word.slice(1)
    }

    private generateExpressRoutes({ routeName, fieldsContent }: RoutingArgs) {
        const matches = [...fieldsContent.matchAll(/"([^"]+)":\s*\[([^\]]*)\]/g)]

        const functionBody = matches.map(match => {
            const methodName = match[1]
            let endpointMethod = ''

            if(methodName.includes('get')) endpointMethod = 'get' 
            if(methodName.includes('add')) endpointMethod = 'post' 
            if(methodName.includes('change')) endpointMethod = 'put' 
            if(methodName.includes('remove')) endpointMethod = 'delete' 

            if(endpointMethod === '') return ''

            return (
                `   ${routeName}Router.${endpointMethod}('${methodName}', ${routeName}Controller.${methodName});\n`
            )
        }).join('')

        return functionBody
    }

    private generateRouting({ routeName, fieldsContent }: RoutingArgs) {
        const RouteName = this.capitalizeFirstLetter(routeName)

        const functionBody = this.generateExpressRoutes({ routeName, fieldsContent })

        return (
            `import { Router } from "express";\n` +
            `import ${RouteName}Controller from './controller/endpoints';\n` +
            `import type I${RouteName} from './types/model';\n\n` +

            `const create${RouteName}Router = ({ ${routeName}Model }: { ${routeName}Model: I${RouteName} }) => {\n` +
            `   const ${routeName}Router  = Router();\n\n` +

            `   const ${routeName}Controller = new ${RouteName}Controller({ ${routeName}Model });\n\n` +
            
                `${functionBody}\n` +

            `   return ${routeName}Router;\n` +
            `}\n\n` +

            `export default create${RouteName}Router;`
        )
    }

    async writeRouteFile({ routeName, readPath, writePath }: WriteArgs) {
        
        const isFieldsFile = await pathExists(readPath)
            .catch(err => { throw new Error(err) })

        if(isFieldsFile) {
            const fieldsContent = await readFile(readPath, 'utf-8')
                .catch(err => { throw new Error(err) })

            const content = this.generateRouting({ routeName, fieldsContent })            

            await writeFile(writePath, content, 'utf-8')
                .catch(err => { throw new Error(err) })
        }
    }
}