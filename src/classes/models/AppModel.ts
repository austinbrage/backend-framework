import { join, relative, resolve, sep } from "path"
import { ensureDir } from "fs-extra"
import { ModelFile } from "./Model"
import { TableFile } from "./Table"
import { FieldsFile } from "./Fields"
import { QueriesFile } from "./Queries"
import { MethodsFile } from "./Methods"

type Constructor = { 
    appFolder: string, 
    serverFolder: string 
}

type MethodArgs = { tableContent?: string, fieldsContent?: string }

export class AppModel {
    private modelFile
    private tableFile
    private fieldsFile
    private queriesFile
    private methodsFile
    private routeName: string
    private appFolder: string
    private serverFolder: string

    constructor({ appFolder, serverFolder }: Constructor) {
        this.routeName = ''
        this.appFolder = resolve(appFolder)
        this.serverFolder = resolve(serverFolder)
        this.modelFile = new ModelFile()
        this.tableFile = new TableFile()
        this.fieldsFile = new FieldsFile()
        this.queriesFile = new QueriesFile()
        this.methodsFile = new MethodsFile()
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

    async createTableFile(filePath: string) {
        if(!this.isTableFile(filePath)) return

        const typesFolderPath = join(this.serverFolder, this.routeName, 'types')
        const tableFilePath = join(typesFolderPath, 'table.ts')

        await ensureDir(typesFolderPath)
            .catch(this.handleError)

        return await this.tableFile.writeTablesFile({ 
            readPath: filePath, 
            writePath: tableFilePath 
        })
            .catch(this.handleError)
    }

    async createHelperFiles(filePath: string) {
        if(!this.isQueriesFile(filePath)) return

        const helpersFolderPath = join(this.serverFolder, this.routeName, 'helpers')
        const queryFilePath = join(helpersFolderPath, 'queries.ts')
        const fieldFilePath = join(helpersFolderPath, 'fields.ts')

        await ensureDir(helpersFolderPath)
            .catch(this.handleError)

        const queries = await this.queriesFile.writeQueriesFile({ 
            readPath: filePath, 
            writePath: queryFilePath,
            tableName: this.routeName 
        })
            .catch(this.handleError)

        if(queries) return await this.fieldsFile.writeFieldsFile({ 
            writePath: fieldFilePath,
            tableName: this.routeName,
            queries 
        })
            .catch(this.handleError)
    }
    
    async createMethodsFile({ tableContent, fieldsContent }: MethodArgs) {

        const typesFolderPath = join(this.serverFolder, this.routeName, 'types')
        const writePath = join(typesFolderPath, 'methods.ts')   

        if(tableContent) {
            const helpersFolderPath = join(this.serverFolder, this.routeName, 'helpers')
            const fieldsPath = join(helpersFolderPath, 'fields.ts')

            await this.methodsFile.writeMethodsFile1({ tableContent, fieldsPath, writePath })
        }

        if(fieldsContent) {
            const tablePath = join(typesFolderPath, 'table.ts')

            await this.methodsFile.writeMethodsFile2({ fieldsContent, tablePath, writePath })
        }
    }

    async createModelFile({ fieldsObject }: { fieldsObject: Record<string, string[]> }) {

        const typesFolderPath = join(this.serverFolder, this.routeName, 'types')
        const methodsPath = join(typesFolderPath, 'methods.ts')   
        const tablePath = join(typesFolderPath, 'table.ts')

        const modelFolderPath = join(this.serverFolder, this.routeName, 'model')
        const writePath = join(modelFolderPath, 'mysql.ts')

        await ensureDir(modelFolderPath)
            .catch(this.handleError)

        await this.modelFile.writeModelFile({ 
            fieldsObject,
            methodsPath, 
            tablePath, 
            routeName: this.routeName, 
            writePath 
        })
            .catch(this.handleError)
    }

    async createModel(filePath: string) {
        const tableContent = await this.createTableFile(filePath)
        if(tableContent) await this.createMethodsFile({ tableContent })

        const fieldsContent = await this.createHelperFiles(filePath)
        if(fieldsContent) await this.createMethodsFile({ fieldsContent: fieldsContent.fieldsObject })

        if(fieldsContent) await this.createModelFile({ fieldsObject: fieldsContent.newFields })
    }
}