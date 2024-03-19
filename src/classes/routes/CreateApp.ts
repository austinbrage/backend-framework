import { writeFile } from "fs-extra"

type AppArgs = { routeNames: string[] }
type WriteArgs = { routeNames: string[], writePath: string }

export class AppFile {

    constructor() {}

    private capitalizeFirstLetter(word: string) {
        return word.charAt(0).toUpperCase() + word.slice(1)
    }

    private generateAppArgs({ routeNames }: AppArgs) {
        
        return routeNames.map((elem) => {
            return `   ${elem}Model,`
        }).join('\n')
    }

    private generateAppType({ routeNames }: AppArgs) {

        return routeNames.map((elem) => {
            const RouteName = this.capitalizeFirstLetter(elem)
            return `   ${elem}Model: I${RouteName};`
        }).join('\n')
    }

    private generateModelTypesImports({ routeNames }: AppArgs) {

        return routeNames.map((elem) => {
            const RouteName = this.capitalizeFirstLetter(elem)
            return `import type I${RouteName} from "./${elem}/types/model";`
        }).join('\n')
    }

    private generateControllerImports({ routeNames }: AppArgs) {

        return routeNames.map((elem) => {
            const RouteName = this.capitalizeFirstLetter(elem)
            return `import create${RouteName}Router from "./${elem}/${elem}";`
        }).join('\n')
    }

    private generateControllerMountings({ routeNames }: AppArgs) {

        return routeNames.map((elem) => {
            const ROUTENAME = elem.toLocaleUpperCase()
            const RouteName = this.capitalizeFirstLetter(elem)
            return `   mainRouter.use(RESOURCES.${ROUTENAME}, create${RouteName}Router({ ${elem}Model }));`
        }).join('\n')
    }

    private modifyCreateFunction({ routeNames }: AppArgs) {

        const args = this.generateAppArgs({ routeNames })
        const types = this.generateAppType({ routeNames })
        const models = this.generateModelTypesImports({ routeNames })
        const controllers = this.generateControllerImports({ routeNames })
        const controllersMounts = this.generateControllerMountings({ routeNames })

        return (
            `import express, { json, Router }  from "express";\n` +
            `import { APP, RESOURCES } from "../global/types/resources";\n` +
            `import corsMiddleware from "../global/middlewares/cors";\n` +
            `import errorMiddleware from "../global/middlewares/error";\n` +
            `import createHealthcareRouter from "./healthcare/healthcare";\n` +
            `${controllers}\n` +
            `import { notFoundHandler } from "../global/services/notFoundHandler";\n` +
            `import { type Pool } from "mysql2/promise";\n` +
            `${models}\n\n` +

            `const createApp = ({\n` +
            `   pingPool,\n` +
                `${args}\n` +
            `}: {\n` +
            `   pingPool: Pool;\n` +
                `${types}\n` +
            `}) => {\n` +
            `   const app = express();\n` +
            `   const mainRouter = Router();\n\n` +

            `   app.use(json());\n` +
            `   app.use(corsMiddleware());\n` +
            `   app.disable('x-powered-by');\n\n` +

            `   mainRouter.use(RESOURCES.PING, createHealthcareRouter({ pingPool }));\n` +
                `${controllersMounts}\n\n` +
            
            `   app.use(APP.VERSION_1, mainRouter);\n` +
            `   app.all('*', notFoundHandler);\n` +
            `   app.use(errorMiddleware);\n\n` +

            `   return app;\n` +
            `}\n\n` +

            `export default createApp;`
        )
    }

    async writeAppFile({ routeNames, writePath }: WriteArgs) {
        const content = this.modifyCreateFunction({ routeNames })            

        await writeFile(writePath, content, 'utf-8')
            .catch(err => { throw new Error(err) })
    }
}