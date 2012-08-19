var $ = require('jquery')

module.exports = Text

function Text (el) {
    this.$el = $(el)
}

Text.prototype.get = function () {
    return this.$el.text()
}

Text.prototype.set = function (val) {
    return this.$el.text(val == null ? '' : String(val))
}
