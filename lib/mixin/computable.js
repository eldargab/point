
module.exports = function (name, deps, fn) {
    var change = 'change:' + name
    var scheduled = '__computable_change_scheduled_' + name
    var cache = '__computable_value_' + name

    this['onget_' + name] = function () {
        if (this[cache] !== undefined) return this[cache]
        return this[cache] = fn.call(this)
    }

    deps.forEach(function (dep) {
        this.on(dep, function () {
            this[cache] = undefined
            if (this[scheduled]) return
            this[scheduled] = true
            var self = this
            setTimeout(function () {
                self[scheduled] = false
                self.emit(change)
            })
        })
    }, this)
}