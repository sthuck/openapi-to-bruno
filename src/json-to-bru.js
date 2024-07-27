import {
  jsonToBruV2,
  jsonToCollectionBru as _jsonToCollectionBru,
  envJsonToBruV2,
} from '@usebruno/lang'
import _ from 'lodash'
/**
 * The transformer function for converting a JSON to BRU file.
 *
 * We map the json response from the app and transform it into the DSL
 * format that the bru lang understands
 *
 * @param {object} json The JSON representation of the BRU file.
 * @returns {string} The BRU file content.
 */
const jsonToBru = (json) => {
  let type = _.get(json, 'type')
  if (type === 'http-request') {
    type = 'http'
  } else if (type === 'graphql-request') {
    type = 'graphql'
  } else {
    type = 'http'
  }

  const sequence = _.get(json, 'seq')
  const bruJson = {
    meta: {
      name: _.get(json, 'name'),
      type: type,
      seq: !isNaN(sequence) ? Number(sequence) : 1,
    },
    http: {
      method: _.lowerCase(_.get(json, 'request.method')),
      url: _.get(json, 'request.url'),
      auth: _.get(json, 'request.auth.mode', 'none'),
      body: _.get(json, 'request.body.mode', 'none'),
    },
    params: _.get(json, 'request.params', []),
    headers: _.get(json, 'request.headers', []),
    auth: _.get(json, 'request.auth', {}),
    body: _.get(json, 'request.body', {}),
    script: _.get(json, 'request.script', {}),
    vars: {
      req: _.get(json, 'request.vars.req', []),
      res: _.get(json, 'request.vars.res', []),
    },
    assertions: _.get(json, 'request.assertions', []),
    tests: _.get(json, 'request.tests', ''),
    docs: _.get(json, 'request.docs', ''),
  }

  return jsonToBruV2(bruJson)
}

const jsonToCollectionBru = (json, isFolder) => {
  try {
    const collectionBruJson = {
      headers: _.get(json, 'request.headers', []),
      script: {
        req: _.get(json, 'request.script.req', ''),
        res: _.get(json, 'request.script.res', ''),
      },
      vars: {
        req: _.get(json, 'request.vars.req', []),
        res: _.get(json, 'request.vars.res', []),
      },
      tests: _.get(json, 'request.tests', ''),
      docs: _.get(json, 'docs', ''),
    }

    // add meta if it exists
    // this is only for folder bru file
    // in the future, all of this will be replaced by standard bru lang
    if (json?.meta) {
      collectionBruJson.meta = {
        name: json.meta.name,
      }
    }

    if (!isFolder) {
      collectionBruJson.auth = _.get(json, 'request.auth', {})
    }

    return _jsonToCollectionBru(collectionBruJson)
  } catch (error) {
    return Promise.reject(error)
  }
}

const envJsonToBru = (json) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const bru = envJsonToBruV2(json)
    return bru
  } catch (error) {
    // return Promise.reject(error);
    throw error
  }
}

export { jsonToBru, jsonToCollectionBru, envJsonToBru }
