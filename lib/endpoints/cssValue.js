var $ = require('jquery')

module.exports = CssValue

function CssValue (el, initialValue) {
    this.$el = $(el)
    this.prev = initialValue
}

CssValue.prototype.set = function (val) {
    if (this.prev) this.$el.removeClass(this.prev)
    this.$el.addClass(val)
    this.prev = val
}

CssValue.prototype.get = function () {
    return this.prev
}