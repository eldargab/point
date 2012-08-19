var $ = require('jquery')

module.exports = Value

function Value (el) {
    this.$el = $(el)
    this.type = el.type

    var self = this

    this.$el.on('change', function () {
        self._onchange && self._onchange()
    })
}

Value.prototype.get = function () {
    return this.type == 'checkbox' || this.type == 'radio'
        ? this.$el[0].checked
        : this.$el.val()
}

Value.prototype.set = function (val) {
    this.type == 'checkbox' || this.type == 'radio'
        ? this.$el[0].checked = !!val
        : this.$el.val(val)
}

Value.prototype.onchange = function (cb) {
    this._onchange = cb
}
