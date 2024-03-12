import { join, relative, resolve, sep } from "path"
import { ensureDir } from "fs-extra"
import { FieldsFile } from "./Fields"
import { QueriesFile } from "./Queries"
import { TableFile } from "./Table"

type Constructor = { 
    appFolder: string, 
    serverFolder: string 
}

export class AppModel {
    private fieldsFile
    private queriesFile
    private tableFile
    private routeName: string
    private appFolder: string
    private serverFolder: string

    constructor({ appFolder, serverFolder }: Constructor) {
        this.routeName = ''
        this.appFolder = resolve(appFolder)
        this.serverFolder = resolve(serverFolder)
        this.fieldsFile = new FieldsFile()
        this.queriesFile = new QueriesFile()
        this.tableFile = new TableFile()
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

        await this.tableFile.writeTablesFile({ 
            readPath: filePath, 
            writePath: tableFilePath 
        })
            .catch(this.handleError)
    }

    async createQueryFieldFiles(filePath: string) {
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

        if(queries) await this.fieldsFile.writeFieldsFile({ 
            writePath: fieldFilePath,
            tableName: this.routeName,
            queries 
        })
            .catch(this.handleError)
    }
}