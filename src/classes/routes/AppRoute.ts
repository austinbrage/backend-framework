import { ResourcesFile } from './Resources'
import { sep, join, resolve, relative } from 'path'
import { readdir, stat, ensureDir, pathExists, remove } from 'fs-extra'

type Constructor = { 
    appFolder: string, 
    serverFolder: string 
}

export class AppRoute {
    private resourcesFile
    private routeName: string
    private routeNames: string[]
    private appFolder: string
    private serverFolder: string

    constructor({ appFolder, serverFolder }: Constructor) {
        this.routeName = ''
        this.routeNames = []
        this.appFolder = resolve(appFolder)
        this.serverFolder = resolve(serverFolder)
        this.resourcesFile = new ResourcesFile()
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

    private async getRouteFolders() {
        const files = await readdir(this.appFolder)
            .catch(this.handleError)

        if(files) {
            for (const name of files) {
                const stats = await stat(`${this.appFolder}/${name}`)
                    .catch(this.handleError)
                    
                const helpersFolderPath = join(this.serverFolder, name, 'helpers')
                const fieldsFilePath = join(helpersFolderPath, 'fields.ts')
    
                const isFieldsFile = await pathExists(fieldsFilePath)
                    .catch(err => { throw new Error(err) })

                if (stats?.isDirectory() && isFieldsFile) {
                    this.routeNames.push(name)
                }
            }
        }

        if(this.routeNames.length === 0) return false
        return true
    }

    private async modifyResourcesFile() {
        const typesFolderPath = join(process.cwd(), 'server', 'global', 'types')
        const resourcesFilePath = join(typesFolderPath, 'resources.ts')

        this.resourcesFile.writeResourcesFile({ 
            routeNames: this.routeNames, 
            writePath: resourcesFilePath 
        })
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

    async createEntryPoints(filePath: string) {
        const isRouteFolders = await this.getRouteFolders()
        if(!isRouteFolders) return

        this.modifyResourcesFile()
    }
}