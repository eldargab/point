var $ = require('jquery')

module.exports = Css

function Css (el, klass) {
    this.$el = $(el)
    this.klass = klass
}

Css.prototype.get = function () {
    return this.$el.hasClass(this.klass)
}

Css.prototype.set = function (val) {
    this.$el.toggleClass(this.klass, !!val)
}