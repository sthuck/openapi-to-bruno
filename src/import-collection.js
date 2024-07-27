import path from 'node:path'
import fs from 'node:fs'
import { jsonToBru, jsonToCollectionBru, envJsonToBru } from './json-to-bru.js'
import { stringifyJson } from './common.js'

const sanitizeDirectoryName = (name) => {
  // eslint-disable-next-line no-control-regex
  return name.replace(/[<>:"/\\|?*\x00-\x1F]+/g, '-')
}

const createDirectory = async (dir) => {
  if (!dir) {
    throw new Error(`directory: path is null`)
  }

  if (fs.existsSync(dir)) {
    throw new Error(`directory: ${dir} already exists`)
  }

  return fs.mkdirSync(dir)
}

const writeFile = async (pathname, content) => {
  try {
    fs.writeFileSync(pathname, content, {
      encoding: 'utf8',
    })
  } catch (err) {
    return Promise.reject(err)
  }
}

/**
 *
 * @param {object} collection
 * @param {string} collectionLocation
 * @returns
 */

export async function importCollection(collection, collectionLocation) {
  try {
    let collectionName = sanitizeDirectoryName(collection.name)
    let collectionPath = path.join(collectionLocation, collectionName)

    if (fs.existsSync(collectionPath)) {
      throw new Error(`collection: ${collectionPath} already exists`)
    }

    // Recursive function to parse the collection items and create files/folders
    const parseCollectionItems = (items = [], currentPath) => {
      items.forEach((item) => {
        if (['http-request', 'graphql-request'].includes(item.type)) {
          const content = jsonToBru(item)
          const filePath = path.join(currentPath, `${item.name}.bru`)
          fs.writeFileSync(filePath, content)
        }
        if (item.type === 'folder') {
          const folderPath = path.join(currentPath, item.name)
          fs.mkdirSync(folderPath)

          if (item?.root?.meta?.name) {
            const folderBruFilePath = path.join(folderPath, 'folder.bru')
            const folderContent = jsonToCollectionBru(
              item.root,
              true, // isFolder
            )
            fs.writeFileSync(folderBruFilePath, folderContent)
          }

          if (item.items && item.items.length) {
            parseCollectionItems(item.items, folderPath)
          }
        }
        // Handle items of type 'js'
        if (item.type === 'js') {
          const filePath = path.join(currentPath, `${item.name}.js`)
          fs.writeFileSync(filePath, item.fileContent)
        }
      })
    }

    const parseEnvironments = (environments = [], collectionPath) => {
      const envDirPath = path.join(collectionPath, 'environments')
      if (!fs.existsSync(envDirPath)) {
        fs.mkdirSync(envDirPath)
      }

      environments.forEach((env) => {
        const content = envJsonToBru(env)
        const filePath = path.join(envDirPath, `${env.name}.bru`)
        fs.writeFileSync(filePath, content, 'utf-8')
      })
    }

    const getBrunoJsonConfig = (collection) => {
      let brunoConfig = collection.brunoConfig

      if (!brunoConfig) {
        brunoConfig = {
          version: '1',
          name: collection.name,
          type: 'collection',
          ignore: ['node_modules', '.git'],
        }
      }

      return brunoConfig
    }

    await createDirectory(collectionPath)

    // const uid = generateUidBasedOnHash(collectionPath)
    const brunoConfig = getBrunoJsonConfig(collection)
    const stringifiedBrunoConfig = await stringifyJson(brunoConfig)

    // Write the Bruno configuration to a file
    await writeFile(
      path.join(collectionPath, 'bruno.json'),
      stringifiedBrunoConfig,
    )

    const collectionContent = jsonToCollectionBru(collection.root)
    await writeFile(
      path.join(collectionPath, 'collection.bru'),
      collectionContent,
    )

    // mainWindow.webContents.send('main:collection-opened', collectionPath, uid, brunoConfig);
    // ipcMain.emit('main:collection-opened', mainWindow, collectionPath, uid, brunoConfig);

    // lastOpenedCollections.add(collectionPath);

    // create folder and files based on collection
    await parseCollectionItems(collection.items, collectionPath)
    await parseEnvironments(collection.environments, collectionPath)
  } catch (error) {
    return Promise.reject(error)
  }
}
