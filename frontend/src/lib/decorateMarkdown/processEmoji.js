import Promise from 'bluebird'
import wemoji from 'wemoji'
import logger from 'logger'

const escape = function (s) {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
}

/**
 * 絵文字のテキストを、Unicodeの絵文字に置換する
 * :+1: → 👍🏻
 * 今後は、Unicodeの絵文字をメインに使う
 */
export default function (input) {
  return Promise.try(() => {
    logger.debug(input)
    const regex = /(:.+?:)/g
    const results = input.match(regex)
    if (results && results.length > 0) {
      results.forEach((str) => {
        logger.debug(str)
        const name = str.substring(1, str.length - 1) // 左右の:を削除
        var emoji = wemoji.name[name]
        if (emoji) {
          input = input.replace(new RegExp(escape(str), 'g'), emoji.emoji)
        }
      })
    }
    logger.debug(input)
    return input
  })
}
