import { sep, join, resolve, relative } from 'path'
import { ensureDir, pathExists, remove } from 'fs-extra'
import { TypesOperations } from './typesGenerator'

type Constructor = { 
    routeFolder: string, 
    serverFolder: string 
}

export class FolderOperations extends TypesOperations {
    private filePath: string
    private routeName: string
    private routeFolder: string
    private serverFolder: string

    constructor({ routeFolder, serverFolder }: Constructor) {
        super()
        this.filePath = ''
        this.routeName = ''
        this.routeFolder = resolve(routeFolder)
        this.serverFolder = resolve(serverFolder)
    }

    private handleError(err: Error) {
        console.error(err.message)
    }

    private isRouteFolder() {
        const relativePath = relative(this.routeFolder, this.filePath)
        const normalizedPath = relativePath.replace(/[\/\\]/g, sep)
        const pathSegments = normalizedPath.split(sep)
        
        return (
            pathSegments.length === 1 
            && pathSegments[0] === this.routeName
        )
    }

    private isTablesFolder() {
        const relativePath = relative(this.routeFolder, this.filePath)
        const normalizedPath = relativePath.replace(/[\/\\]/g, sep)
        const pathSegments = normalizedPath.split(sep)

        return (
            pathSegments.length === 3 
            && pathSegments[0] === this.routeName 
            && pathSegments[1] === 'tables'
            && pathSegments[2]?.endsWith('.sql')
        )
    }

    async createServerFolder() { 
        await ensureDir(this.serverFolder)
            .catch(this.handleError) 
    }

    getFilePath(filePath: string) {
        this.filePath = resolve(filePath) 
    }

    getRouteName() {
        const relativePath = relative(this.routeFolder, this.filePath)
        const normalizedPath = relativePath.replace(/[\/\\]/g, sep)
        const pathSegments = normalizedPath.split(sep)
        this.routeName = pathSegments[0] 
    }

    async createRouteFolder() {
        if(!this.routeName || !this.isRouteFolder()) return

        const serverFolderPath = join(this.serverFolder, this.routeName)
        await ensureDir(serverFolderPath)
            .catch(this.handleError)
    }

    async deleteRouteFolder() {
        if(!this.routeName || !this.isRouteFolder()) return

        const serverFolderPath = join(this.serverFolder, this.routeName)
        const exists = await pathExists(serverFolderPath)
            .catch(this.handleError)
            
        if(exists) await remove(serverFolderPath)
            .catch(this.handleError)
    }

    async createTypesFile() {
        if(!this.routeName || !this.isTablesFolder()) return

        const typesFolderPath = join(this.serverFolder, this.routeName, 'types')
        const tablesFilePath = join(typesFolderPath, 'tables.ts')

        await ensureDir(typesFolderPath)
            .catch(this.handleError)

        await this.writeTypeScriptFile(this.filePath, tablesFilePath)
            .catch(this.handleError)

    }
}