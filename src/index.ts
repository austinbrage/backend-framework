#!/usr/bin/env node

import chokidar from 'chokidar'
import { AppModel } from './classes/models/AppModel'
import { AppRoute } from './classes/routes/AppRoute'
import { appFolder, serverFolder } from './config/consts'

const init = { appFolder, serverFolder }

const watcher = chokidar.watch(appFolder, {
    ignored: /(^|[/\\])\../, 
    persistent: true
})

// Create, Delete Server Route
watcher.on('addDir', async (path) => {
    const appRoute = new AppRoute(init)
    await appRoute.createServerFolder()
    await appRoute.createRouteFolder(path)
})

watcher.on('unlinkDir', async (path) => {
    const appRoute = new AppRoute(init)
    await appRoute.deleteRouteFolder(path)
})

// Create Server Routes Model
watcher.on('add', async (path) => {
    const appModel = new AppModel(init)
    await appModel.createTableFile(path)
    await appModel.createQueryFieldFiles(path)
})

watcher.on('change', async (path) => {
    const appModel = new AppModel(init)
    await appModel.createTableFile(path)
    await appModel.createQueryFieldFiles(path)
})

watcher.on('all', async (event, path) => { 
    console.log(event, path)
})