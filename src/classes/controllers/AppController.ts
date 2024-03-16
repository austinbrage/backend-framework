import { ensureDir } from "fs-extra"
import { SchemaFile } from "./Schemas"
import { ValidationFile } from './Validations'
import { ControllerFile } from "./Controller"
import { join, relative, resolve, sep } from "path"

type Constructor = { 
    appFolder: string, 
    serverFolder: string 
}

export class AppController {
    private schemaFile
    private validationFile
    private controllerFile
    private routeName: string
    private appFolder: string
    private serverFolder: string

    constructor({ appFolder, serverFolder }: Constructor) {
        this.routeName = ''
        this.appFolder = resolve(appFolder)
        this.serverFolder = resolve(serverFolder)
        this.schemaFile = new SchemaFile()
        this.validationFile = new ValidationFile()
        this.controllerFile = new ControllerFile()
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

        const validationFolderPath = join(this.serverFolder, this.routeName, 'validation')
        const schemaFilePath = join(validationFolderPath, 'schema.ts')

        await ensureDir(validationFolderPath)
            .catch(this.handleError)

        await this.schemaFile.writeSchemaFile({ 
            readPath: tableFilePath, 
            writePath: schemaFilePath,
            routeName: this.routeName
        })
            .catch(this.handleError)
    }

    private async createValidationFile(filePath: string) {
        if(!this.isTableFile(filePath) && !this.isQueriesFile(filePath)) return

        const helpersFolderPath = join(this.serverFolder, this.routeName, 'helpers')
        const fieldsFilePath = join(helpersFolderPath, 'fields.ts')

        const validationFolderPath = join(this.serverFolder, this.routeName, 'validation')
        const validatorFilePath = join(validationFolderPath, 'validator.ts')

        await ensureDir(validationFolderPath)
            .catch(this.handleError)

        await this.validationFile.writeValidationFile({ 
            readPath: fieldsFilePath, 
            writePath: validatorFilePath,
            routeName: this.routeName
        })
            .catch(this.handleError)
    }

    private async createControllerFile(filePath: string) {
        if(!this.isTableFile(filePath) && !this.isQueriesFile(filePath)) return
        
        const helpersFolderPath = join(this.serverFolder, this.routeName, 'helpers')
        const fieldsFilePath = join(helpersFolderPath, 'fields.ts')

        const controllerFolderPath = join(this.serverFolder, this.routeName, 'controller')
        const endpointsFilePath = join(controllerFolderPath, 'endpoints.ts')
        
        await ensureDir(controllerFolderPath)
            .catch(this.handleError)

        await this.controllerFile.writeValidationFile({ 
            readPath: fieldsFilePath, 
            writePath: endpointsFilePath,
            routeName: this.routeName
        })
            .catch(this.handleError)
    }

    async createController(filePath: string) {
        await this.createSchemaFile(filePath)
        await this.createValidationFile(filePath)
        await this.createControllerFile(filePath)
    }
}