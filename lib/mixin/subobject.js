module.exports = function (prop, Klass) {
    var child = '__subobject_' + prop
    var proto = Klass.prototype || Klass

    this[prop] = function () {
        var o = this[child]
        if (!o) {
            o = this[child] = Object.create(proto, {__ui_parent: {value: this}})
            this.emit('subobject:' + prop, o, prop)

        } else if (o.__ui_parent !== this) {
            o = this[child] = Object.create(o, {__ui_parent: {value: this}})
        }
        return o
    }

    this.on('json', function (json) {
        var j = this[prop]().toJSON()
        if (j !== undefined) json[prop] = j
    })

    this.on('_reset_', function (attr) {
        var initials = attr && attr[prop]
        if (initials) delete attr[prop]
        this[prop]().reset(initials)
    })

    this['onget_' + prop] = function () {
        return this[prop]()
    }

    this['onset_' + prop] = function (val) {
        this[prop]().set(val)
    }
}
