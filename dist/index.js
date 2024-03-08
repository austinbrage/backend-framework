#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chokidar_1 = __importDefault(require("chokidar"));
const path_1 = require("path");
const routeFolder = (0, path_1.join)(process.cwd(), 'app', 'routes');
const watcher = chokidar_1.default.watch(routeFolder, {
    ignored: /(^|[\/\\])\../,
    persistent: true
});
watcher
    .on('all', (event, path) => { console.log(event, path); });
