import api from '../../api'
import logger from 'logger'

const LABEL = 'getTypes.js'

export default (context) => {
  logger.debug(LABEL, 'get types from api')
  return api.request('get', '/_api/types', null)
  .then(response => {
    logger.debug(LABEL, response.data)
    var types = response.data
    context.commit('SET_RESOURCES', {
      types: types
    })
  })
  .catch(error => {
    logger.error(LABEL, error)
  })
}
