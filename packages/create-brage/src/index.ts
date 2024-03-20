#!/usr/bin/env node

import { join } from "path"
import { copy, pathExists, mkdir } from "fs-extra"
import prompts, { type PromptObject } from "prompts"

const defaultProjectName = 'brage-project'

const prompt: PromptObject = {
    type: 'text',
    name: 'projectName',
    message: 'Project name: ',
    initial: defaultProjectName
}

async function createTemplate() {
    const response = await prompts(prompt)
        .catch(err => { throw new Error(err) })

    const templatesFolder = join(__dirname, '../template')
    const projectRoute = join(process.cwd(), response.projectName)

    const isProjectRoute = await pathExists(projectRoute)
        .catch(err => { throw new Error(err) })

    const filterFunc = (src: string) => {
        return !src.includes('node_modules')
    }

    console.log('Creating Template...\n')

    if(!isProjectRoute) {
        await mkdir(projectRoute)
            .catch(err => { throw new Error(err) })

        await copy(templatesFolder, projectRoute, { filter: filterFunc })
            .catch(err => { throw new Error(err) })
    } else {
        await copy(templatesFolder, projectRoute, { filter: filterFunc })
            .catch(err => { throw new Error(err) })
    }

    console.log('Template created!\n Proceed to:\n')
    console.log(`  cd ${response.projectName}`)
    console.log('  npm install')
}

createTemplate()
    .catch(err => console.error('Something went wrong, ' + err.message))