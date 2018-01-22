import Promise from 'bluebird'
import api from '../../api'
import logger from 'logger'

import actionCommon from './actionCommon'

import processDecorateAll from '../../lib/decorateMarkdown/processDecorateAll'
import processToc from '../../lib/decorateMarkdown/processToc'
import processTemplateItemView from '../../lib/displayParts/processTemplateItemView'

const LABEL = 'getArticle.js'

export default (context, id) => {
  context.commit('SET_PAGE_STATE', {loading: true})
  context.commit('SET_RESOURCES', {article: ''})
  api.request('get', '/_api/articles/' + id + '', null, context.state.token)
  .then(response => {
    var article = response.data
    actionCommon.setIcon(context, article)
    logger.debug(LABEL, response)
    return Promise.try(() => {
      return processDecorateAll(response.data.content)
    }).then(function (result) {
      logger.debug(LABEL, result)
      article.displaySafeHtml = result
      return processToc(result)
    }).then(function (toc) {
      logger.debug(LABEL, toc)
      context.commit('SET_RESOURCES', {toc: toc})
      return api.request('get', '/_api/articles/' + id + '/items', null, context.state.token)
    }).then(function (response) {
      return processTemplateItemView(response.data)
    }).then(function (itemsHtml) {
      logger.debug(itemsHtml)
      article.itemsHtml = itemsHtml
      context.commit('SET_RESOURCES', {article: article})
      // return article.comments
      return api.request('get', '/_api/articles/' + id + '/comments', null, context.state.token)
    }).then(function (response) {
      logger.debug(LABEL, response.data)
      return Promise.each(response.data, function (comment) {
        return processDecorateAll(comment.comment).then(function (result) {
          comment.displaySafeHtml = result
          actionCommon.setIcon(context, comment)
        })
      })
    }).then(function (comments) {
      context.commit('SET_RESOURCES', {comments: comments})
      context.commit('SET_PAGE_STATE', {loading: false})
    })
  })
  .catch(error => {
    context.commit('SET_PAGE_STATE', {loading: false})
    logger.error(LABEL, error)
  })
}
