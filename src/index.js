#!/usr/bin/env node

import chokidar from 'chokidar'
import { join } from 'path'

const routeFolder = join(process.cwd(), 'app', 'routes')

const watcher = chokidar.watch(routeFolder, {
    ignored: /(^|[\/\\])\../, 
    persistent: true
})

watcher
    .on('all', (event, path) => { console.log(event, path); })