var $ = require('jquery')

module.exports = Event

function Event (el, name) {
    this.$el = $(el)
    var self = this
    this.$el.on(name, function (e) {
        self.stop = false
        self.hooks && self.hooks.forEach(function (hook) {
            !self.stop && hook.call(this, e)
        }, self)
    })
}

Event.prototype.onevent = function (cb) {
    if (!this.hooks) this.hooks = []
    this.hooks.push(cb)
}