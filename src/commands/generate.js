import { Args, Command } from '@oclif/core'
import { importCollection } from '../import-collection.js'
import importOpenApiCollection from '../openapi-collection.js'
import fs from 'node:fs'

export default class Generate extends Command {
  static args = {
    file: Args.string({
      description: 'openapi file to read, json or yaml',
      required: true,
    }),
    output: Args.string({ description: 'output directory', required: true }),
  }

  static description = 'Generate bruno collection from openapi file'

  static examples = ['<%= config.bin %> <%= command.id %>']

  async run() {
    const { args } = await this.parse(Generate)
    const { file, output } = args

    if (!fs.existsSync(output)) {
      fs.mkdirSync(output, { recursive: true })
    }

    const { collection } = await importOpenApiCollection(file)
    await importCollection(collection, output)
  }
}
