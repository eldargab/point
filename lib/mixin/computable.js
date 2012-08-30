
module.exports = function (name, deps, fn) {
    var change = 'change:' + name
    var scheduled = '__computable_change_scheduled_' + name
    var cache = '__computable_value_' + name
    var cached = '__computable_is_cached_' + name

    this['onget_' + name] = function () {
        if (this[cached]) return this[cache]
        this[cached] = true
        return this[cache] = fn.call(this)
    }

    function clearCache () {
        this[cached] = false
        this[cache] = null
        this.emit('_change_:' + name)
    }

    deps.forEach(function (dep) {
        if (dep[0] == ':') dep = '_change_' + dep
        this.on(dep, function () {
            clearCache.call(this)
            if (this[scheduled]) return
            this[scheduled] = true
            var self = this
            setTimeout(function () {
                self[scheduled] = false
                self.emit(change)
            })
        })
    }, this)

    this.on('_reset_', clearCache)
}