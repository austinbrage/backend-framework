#!/usr/bin/env node

import chokidar from 'chokidar'
import { FolderOperations } from './classes/AppRoutes'
import { routeFolder, serverFolder } from './config/consts'

const folderOperations = new FolderOperations({ routeFolder, serverFolder })

const watcher = chokidar.watch(routeFolder, {
    ignored: /(^|[\/\\])\../, 
    persistent: true
})

watcher.on('all', async (event, path) => { 
    console.log(event, path)
    
    await folderOperations.createServerFolder()

    folderOperations.getRouteName()
    folderOperations.getFilePath(path)

    if(event === 'addDir') {
        await folderOperations.createRouteFolder()
    } else if(event === 'add' || event === 'change') {
        await folderOperations.createTypesFile()
        await folderOperations.createQueriesFile()
    } else if(event === 'unlinkDir') {
        await folderOperations.deleteRouteFolder()    
    }
})