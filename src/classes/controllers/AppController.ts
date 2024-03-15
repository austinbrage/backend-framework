import { SchemaFile } from "./Schemas"
import { ensureDir } from "fs-extra"
import { join, relative, resolve, sep } from "path"

type Constructor = { 
    appFolder: string, 
    serverFolder: string 
}

export class AppController {
    private schemaFile
    private routeName: string
    private appFolder: string
    private serverFolder: string

    constructor({ appFolder, serverFolder }: Constructor) {
        this.routeName = ''
        this.appFolder = resolve(appFolder)
        this.serverFolder = resolve(serverFolder)
        this.schemaFile = new SchemaFile()
    }

    private handleError(err: Error) {
        console.error(err.message)
    }

    private isQueriesFile(filePath: string) {
        const relativePath = relative(this.appFolder, resolve(filePath))
        const normalizedPath = relativePath.replace(/[/\\]/g, sep)
        const pathSegments = normalizedPath.split(sep)
        
        if(pathSegments.length !== 2) return false
        if(pathSegments[1] !== 'queries.sql') return false
        
        this.routeName = pathSegments[0]  
        return true
    }

    private isTableFile(filePath: string) {
        const relativePath = relative(this.appFolder, resolve(filePath))
        const normalizedPath = relativePath.replace(/[/\\]/g, sep)
        const pathSegments = normalizedPath.split(sep)

        if(pathSegments.length !== 2) return false
        if(pathSegments[1] !== 'table.sql') return false
        
        this.routeName = pathSegments[0]  
        return true
    }

    private async createSchemaFile(filePath: string) {
        if(!this.isTableFile(filePath)) return

        const typesFolderPath = join(this.serverFolder, this.routeName, 'types')
        const tableFilePath = join(typesFolderPath, 'table.ts')

        const schemasFolderPath = join(this.serverFolder, this.routeName, 'schema')
        const schemaFilePath = join(schemasFolderPath, 'object.ts')

        await ensureDir(schemasFolderPath)
            .catch(this.handleError)

        await this.schemaFile.writeSchemaFile({ 
            readPath: tableFilePath, 
            writePath: schemaFilePath,
            routeName: this.routeName
        })
            .catch(this.handleError)
    }

    async createController(filePath: string) {
        await this.createSchemaFile(filePath)
    }
}