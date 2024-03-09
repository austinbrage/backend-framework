import { sep, join, resolve, relative } from 'path'
import { ensureDir, pathExists, remove, writeFile } from 'fs-extra'

type Constructor = { 
    routeFolder: string, 
    serverFolder: string 
}

export class FolderOperations {
    private routeFolder: string
    private serverFolder: string

    constructor({ routeFolder, serverFolder }: Constructor) {
        this.routeFolder = resolve(routeFolder)
        this.serverFolder = resolve(serverFolder)
    }

    private handleError(err: Error) {
        console.error(err.message)
    }

    private isRouteFolder(filePath: string, routeName: string) {
        const relativePath = relative(this.routeFolder, filePath)
        const normalizedPath = relativePath.replace(/[\/\\]/g, sep)
        const pathSegments = normalizedPath.split(sep)
        
        return (
            pathSegments.length === 1 
            && pathSegments[0] === routeName
        )
    }

    private isTablesFolder(filePath: string, routeName: string) {
        const relativePath = relative(this.routeFolder, filePath)
        const normalizedPath = relativePath.replace(/[\/\\]/g, sep)
        const pathSegments = normalizedPath.split(sep)

        return (
            pathSegments.length === 3 
            && pathSegments[0] === routeName 
            && pathSegments[1] === 'tables'
            && pathSegments[2]?.endsWith('.sql')
        )
    }

    async createServerFolder() { 
        await ensureDir(this.serverFolder)
            .catch(this.handleError) 
    }

    getRouteName(filePath: string) {
        const relativePath = relative(this.routeFolder, filePath)
        const normalizedPath = relativePath.replace(/[\/\\]/g, sep)
        const pathSegments = normalizedPath.split(sep)
        return pathSegments[0]
    }

    async createRouteFolder(filePath: string, routeName: string) {
        if(!this.isRouteFolder(filePath, routeName)) return

        const serverFolderPath = join(this.serverFolder, routeName)
        await ensureDir(serverFolderPath)
            .catch(this.handleError)
    }

    async deleteRouteFolder(filePath: string, routeName: string) {
        if(!this.isRouteFolder(filePath, routeName)) return

        const serverFolderPath = join(this.serverFolder, routeName)
        const exists = await pathExists(serverFolderPath)
            .catch(this.handleError)
            
        if(exists) await remove(serverFolderPath)
            .catch(this.handleError)
    }

    async createTypesFile(filePath: string, routeName: string) {
        console.log('isTablesFolder', this.isTablesFolder(filePath, routeName))

        if(!this.isTablesFolder(filePath, routeName)) return

        const typesFolderPath = join(this.serverFolder, routeName, 'types')
        const tablesFilePath = join(typesFolderPath, 'tables.ts')

        await ensureDir(typesFolderPath)
            .catch(this.handleError)

        await writeFile(tablesFilePath, '/* Contenido de tables.ts */')
            .catch(this.handleError)
    }
}