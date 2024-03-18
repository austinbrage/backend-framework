import { writeFile } from "fs-extra"

type ResourceArgs = { routeNames: string[] }
type WriteArgs = { routeNames: string[], writePath: string }

export class ResourcesFile {

    constructor() {}

    private generateResources({ routeNames }: ResourceArgs) {

        return routeNames.map((elem, index) => {
            if(index === routeNames.length - 1) return `   ${elem.toUpperCase()} = '/${elem}'`
            return `   ${elem.toUpperCase()} = '/${elem}',`
        }).join('\n')
    }

    private modifyEnums({ routeNames }: ResourceArgs) {

        const resources = this.generateResources({ routeNames })

        return (
            `export enum APP {\n` +
            `   VERSION_1 = '/app'\n` +
            `}\n\n` +

            `export enum RESOURCES {\n` +
            `   PING = '/ping',\n` +
                `${resources}\n` +
            `}`
        )
    }

    async writeResourcesFile({ routeNames, writePath }: WriteArgs) {
        const content = this.modifyEnums({ routeNames })            

        await writeFile(writePath, content, 'utf-8')
            .catch(err => { throw new Error(err) })
    }
}