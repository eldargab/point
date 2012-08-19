var parse = require('./parse-points-attr')
var filters = require('./filters')
var Emitter = require('../emitter')
var util = require('../util')
var thisFn = util.thisFn


module.exports = View

function View () {}

Emitter.extend(View)

View.prototype.attach = function (model) {
    this.model = model
    this.emit('attach')
}

View.prototype.detach = function () {
    this.emit('detach')
    this.model = undefined
}

View.prototype.on('attach', function () {
    this.model.onevent(thisFn(this, 'onModelEvent'))
})

View.prototype.on('detach', function () {
    this.model.offevent(this._onModelEvent)
})

View.prototype.onModelEvent = function (ev) {
    ev = 'model:' + ev
    this.emit.apply(this, arguments)
}

View.prototype.on('domevent', function (id, e) {
    var fn = this[id]
    if (fn) return fn.call(this, e)
    fn = this.model && this.model[id]
    fn && fn.call(this.model)
})

View.prototype.clearDom = function () {
    var p = this.el && this.el.parentNode
    p && p.removeChild(this.el)
}

View.prototype.destroy = function () {
    this.clearDom()
    this.model && this.detach()
    this.emit('destroy')
}

View.prototype.bind = function () {
    this.forEachPoint(function (type, param, path, filters, el) {
        var p = this.createPoint(type, param, el); if (!p) return
        for (var i = 0; i < filters.length; i++) {
            p = this.onfilter(filters[i], p)
        }
        this.onbind(p, type, path)
    })
}

View.prototype.forEachPoint = function (cb) {
    this.forEachElementPoint(this.el, cb)
    var childs = this.el.getElementsByTagName('*')
    for (var i = 0; i < childs.length; i++) {
        this.forEachElementPoint(childs[i], cb)
    }
}

View.prototype.forEachElementPoint = function (el, cb) {
    var self = this
    var points = el.getAttribute('data-bind')
    points && parse(points, function (type, param, path, filters) {
        cb.call(self, type, param, path, filters, el)
    })
}

View.prototype.createPoint = function (type, param, el) {
    var create = this['point_' + type]
    if (create) return create.call(this, el, param)
    var Type = util.endpoint(type)
    return Type && (new Type(el, param))
}

View.prototype.onfilter = function (type, point) {
    var filter = this['filter_' + type] || filters[type]
    return filter ? filter(point) : point
}

View.prototype.onbind = function (point, type, path) {
    var bind = this['bind_' + type + '_at_' + path]
    if (bind) {
        bind.call(this, point)
        return
    }

    bind = this['bind_' + type]
    if (bind) {
        bind.call(this, point, path)
        return
    }

    this.bindPoint(point, path)
}

View.prototype.bindPoint = function (point, path) {
    if (!point.set) return
    var self = this

    point.onchange && point.onchange(function push () {
        self.model && self.model.set(path, point.get())
    })

    function pull () {
        point.set(self.model && self.model.get(path))
    }

    this.on('model:change:' + path, pull)
    this.on('attach', pull)
    pull()
}

View.prototype.bind_event = function (point, path) {
    var self = this
    point.onevent(function (e) {
        self.emit('domevent', path, e)
    })
}

View.prototype.render = function () {
    this.el = this.html.cloneNode(true)
    this.bind()
}