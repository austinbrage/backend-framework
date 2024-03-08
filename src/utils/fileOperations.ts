import { sep, join, resolve, relative } from 'path'
import { ensureDir, pathExists, remove } from 'fs-extra'

export class FolderOperations {
    private routeFolder: string
    private serverFolder: string

    constructor({ routeFolder, serverFolder }: { routeFolder: string, serverFolder: string }) {
        this.routeFolder = resolve(routeFolder)
        this.serverFolder = resolve(serverFolder)
    }

    private handleError(err: Error) {
        console.error(err.message)
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

    async createRouteFolder(routeName: string) {
        const serverFolderPath = join(this.serverFolder, routeName)
        await ensureDir(serverFolderPath)
            .catch(this.handleError)
    }

    async deleteRouteFolder(routeName: string) {
        const serverFolderPath = join(this.serverFolder, routeName)
        const exists = await pathExists(serverFolderPath)
            .catch(this.handleError)
            
        if(exists) await remove(serverFolderPath)
            .catch(this.handleError)
    }
}