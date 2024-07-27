import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'

import fs from 'node:fs/promises'
import importOpenApiCollection from '../src/openapi-collection.js'
import { importCollection } from '../src/import-collection.js'



describe('integration test', () => {
  before(async () => {
    await fs.rm('test/test-fixture-output', { recursive: true, force: true })
    await fs.mkdir('test/test-fixture-output', { recursive: true })
  })

  after(async () => {
    await fs.rm('test/test-fixture-output', { recursive: true, force: true })
  })

  it('should import openapi collection and import collection', async () => {

    const { collection } = await importOpenApiCollection('test/openapi.json')
    await importCollection(collection, 'test/test-fixture-output')

    const fileCreated = await fs.statfs('test/test-fixture-output/Demo API/Hello.bru')
    assert.ok(fileCreated, 'bruno file created')
  })
})


