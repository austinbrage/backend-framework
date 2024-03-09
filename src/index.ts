#!/usr/bin/env node

import chokidar from 'chokidar'
import { resolve } from 'path'
import { FolderOperations } from './utils/fileOperations'
import { routeFolder, serverFolder } from './config/consts'

const folderOperations = new FolderOperations({ routeFolder, serverFolder })

const watcher = chokidar.watch(routeFolder, {
    ignored: /(^|[\/\\])\../, 
    persistent: true
})

watcher.on('all', async (event, path) => { 
    console.log(event, path)

    const absolutePath = resolve(path)
    
    await folderOperations.createServerFolder()
    const routeName = folderOperations.getRouteName(absolutePath)

    if(!routeName) return

    if(event === 'addDir') {
        await folderOperations.createRouteFolder(absolutePath, routeName)
    } else if(event === 'add' || event === 'change') {
        await folderOperations.createTypesFile(absolutePath, routeName)
    } else if(event === 'unlinkDir') {
        await folderOperations.deleteRouteFolder(absolutePath, routeName)    
    }
})