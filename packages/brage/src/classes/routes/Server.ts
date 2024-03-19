import { writeFile } from "fs-extra"

type ServerArgs = { routeNames: string[] }
type WriteArgs = { routeNames: string[], writePath: string }

export class IndexFile {

    constructor() {}

    private capitalizeFirstLetter(word: string) {
        return word.charAt(0).toUpperCase() + word.slice(1)
    }

    private generatePools({ routeNames }: ServerArgs) {

        return routeNames.map(elem => {
            return `const ${elem}Pool = createPoolConnection({ wait: true, cLimit: 1, qLimit: 0 });`
        }).join('\n')
    }

    private generateModels({ routeNames }: ServerArgs) {

        return routeNames.map(elem => {
            const RouteName = this.capitalizeFirstLetter(elem)
            return `const ${elem}Model = new ${RouteName}Model({ ${elem}Pool });`
        }).join('\n')
    }

    private generateImports({ routeNames }: ServerArgs) {

        return routeNames.map(elem => {
            const RouteName = this.capitalizeFirstLetter(elem)
            return `import ${RouteName}Model from "./routes/${elem}/model/mysql";`
        }).join('\n')
    }

    private generateExports({ routeNames }: ServerArgs) {

        return routeNames.map((elem, index) => {
            if(index === elem.length - 1) return `   ${elem}Pool`
            return `   ${elem}Pool,`
        }).join('\n')
    }

    private generateModelsArgs({ routeNames }: ServerArgs) {

        return routeNames.map((elem, index) => {
            if(index === elem.length - 1) return `   ${elem}Model`
            return `   ${elem}Model,`
        }).join('\n')
    }

    private modifyBodyFile({ routeNames }: ServerArgs) {

        const pools = this.generatePools({ routeNames })
        const models = this.generateModels({ routeNames })
        const imports = this.generateImports({ routeNames })
        const exports = this.generateExports({ routeNames })
        const modelsArgs = this.generateModelsArgs({ routeNames })

        return (
            `import createApp from "./routes/app";\n` +
            `${imports}\n` +
            `import { PORT, ENVIRONMENT } from "./global/utils/config";\n` +
            `import { createPoolConnection } from "./global/services/database";\n\n` +

            `const pingPool = createPoolConnection({ wait: true, cLimit: 1, qLimit: 0 });\n` +
            `${pools}\n\n` +

            `${models}\n\n` +

            `const app = createApp({\n` +
            `   pingPool,\n` +
                `${modelsArgs}\n` +
            `})\n\n` +

            `const server = app.listen(PORT[ENVIRONMENT], () => {\n` +
            `   console.log(\`Server running on Port: \${PORT[ENVIRONMENT]}\`);\n` +
            `})\n\n` +

            `export {\n` +
            `   app,\n` +
            `   server,\n` +
                `${exports}\n` +
            `};`
        )
    }

    async writeServerFile({ routeNames, writePath }: WriteArgs) {
        const content = this.modifyBodyFile({ routeNames })            

        await writeFile(writePath, content, 'utf-8')
            .catch(err => { throw new Error(err) })
    }
}