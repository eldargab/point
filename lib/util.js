var uid = 0

exports.guid = function (obj) {
    if (obj.__uid) return obj.__uid
    return obj.__uid = ++uid
}

exports.mix = function (target, src) {
    for (var key in src) {
        target[key] = src[key]
    }
    return target
}

exports.extend = function (Klass, parent) {
    if (parent && parent.prototype) {
        Klass.prototype = Object.create(parent.prototype)
    } else if (arguments.length > 1) {
        Klass.prototype = Object.create(parent)
    }
    Klass.use = function () {
        exports.use.apply(this.prototype, arguments)
        return this
    }
    Klass.extend = function (ChildKlass) {
        ChildKlass = ChildKlass || function () {}
        return exports.extend(ChildKlass, this)
    }
    return Klass
}

exports.use = function use (proto) {
    switch (typeof proto) {
        case 'function':
            var protoHasEnumerables = false
            for (var key in proto.prototype) {
                this[key] = proto.prototype[key]
                protoHasEnumerables = true
            }
            if (!protoHasEnumerables)
                proto.apply(this, Array.prototype.slice.call(arguments, 1))
            break
        case 'string':
            proto = exports.mixin(proto)
            use.apply(this, arguments)
            break
        default:
            for (var key in proto) {
                this[key] = proto[key]
            }
    }
    return this
}

exports.mixin = function (name) {
    return require('./mixin/' + name)
}

exports.thisFn = function (ctx, prop) {
    var key = '_' + prop
    if (ctx[key]) return ctx[key]
    return ctx[key] = function () {
        ctx[prop].apply(ctx, arguments)
    }
}

var eCache = {}

exports.endpoint = function (type) {
    if (eCache[type] !== undefined) return eCache[type]
    try {
        return eCache[type] = require('./endpoints/' + type)
    } catch (e) {
        return eCache[type] = null
    }
}
