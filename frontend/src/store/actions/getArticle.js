import Promise from 'bluebird'
import api from '../../api'
import logger from 'logger'

import actionCommon from './actionCommon'

import processDecorateAll from '../../lib/decorateMarkdown/processDecorateAll'
import processToc from '../../lib/decorateMarkdown/processToc'
import processTemplateItemView from '../../lib/displayParts/processTemplateItemView'

const LABEL = 'getArticle.js'

export default (state, id) => {
  state.commit('SET_PAGE_STATE', {loading: true})
  return Promise.try(() => {
    state.commit('SET_RESOURCES', {article: ''})
    state.commit('SET_RESOURCES', {comments: []})
    state.commit('CREAR_ALERTS')
    return api.request('get', '/_api/articles/' + id + '', null)
    .then(response => {
      var article = response.data
      actionCommon.setIcon(state, article)
      logger.debug(LABEL, response)
      return Promise.try(() => {
        return processDecorateAll(response.data.content)
      }).then(function (result) {
        logger.debug(LABEL, result)
        article.displaySafeHtml = result
        return processToc(result)
      }).then(function (toc) {
        logger.debug(LABEL, toc)
        state.commit('SET_RESOURCES', {toc: toc})
        return api.request('get', '/_api/articles/' + id + '/items', null)
      }).then(function (response) {
        return processTemplateItemView(response.data)
      }).then(function (itemsHtml) {
        logger.debug(itemsHtml)
        article.itemsHtml = itemsHtml
        state.commit('SET_RESOURCES', {article: article})
        // return article.comments
        return api.request('get', '/_api/articles/' + id + '/comments', null)
      }).then(function (response) {
        logger.debug(LABEL, response.data)
        return Promise.each(response.data, function (comment) {
          return processDecorateAll(comment.comment).then(function (result) {
            comment.displaySafeHtml = result
            actionCommon.setIcon(state, comment)
          })
        })
      }).then(function (comments) {
        state.commit('SET_RESOURCES', {comments: comments})
      })
    })
  }).catch(error => {
    logger.error(LABEL, JSON.stringify(error))
    var msg = logger.buildResponseErrorMsg(error.response, {suffix: 'Please try again.'})
    state.commit('ADD_ALERT', {
      type: 'warning',
      title: 'Error',
      content: msg
    })
    throw error
  }).finally(() => {
    state.commit('SET_PAGE_STATE', {loading: false})
  })
}
