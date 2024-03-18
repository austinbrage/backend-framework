import { sep, join, resolve, relative } from 'path'
import { ensureDir, pathExists, remove } from 'fs-extra'

type Constructor = { 
    appFolder: string, 
    serverFolder: string 
}

export class AppRoute {
    private routeName: string
    private appFolder: string
    private serverFolder: string

    constructor({ appFolder, serverFolder }: Constructor) {
        this.routeName = ''
        this.appFolder = resolve(appFolder)
        this.serverFolder = resolve(serverFolder)
    }

    private handleError(err: Error) {
        console.error(err.message)
    }

    private isRouteFolder(filePath: string) {
        const relativePath = relative(this.appFolder, resolve(filePath))
        const normalizedPath = relativePath.replace(/[/\\]/g, sep)
        const pathSegments = normalizedPath.split(sep)
        
        if(pathSegments.length !== 1) return false
        this.routeName = pathSegments[0]  
    }

    async createRouteFolder(filePath: string) {
        if(!this.isRouteFolder(filePath)) return

        const serverFolderPath = join(this.serverFolder, this.routeName)
        await ensureDir(serverFolderPath)
            .catch(this.handleError)
    }

    async deleteRouteFolder(filePath: string) {
        if(!this.isRouteFolder(filePath)) return

        const serverFolderPath = join(this.serverFolder, this.routeName)
        const exists = await pathExists(serverFolderPath)
            .catch(this.handleError)
            
        if(exists) await remove(serverFolderPath)
            .catch(this.handleError)
    }
}