var parse = require('./data-bind-syntax')
var filters = require('./filters')
var Emitter = require('../emitter')
var util = require('../util')
var thisFn = util.thisFn


module.exports = View

function View () {}

Emitter.extend(View)

View.prototype.attach = function (p, model) {
    if (typeof p != 'string') {
        model = p
        p = ''
    }
    this['model' + p] = model
    this.emit('attach' + p, model)
}

View.prototype.detach = function (p) {
    p = p || ''
    var model = 'model' + p
    this.emit('detach' + p, this[model])
    this[model] = undefined
}

View.prototype.getModel = function (p) {
    return p ? this['model' + p] : this.model
}

View.prototype.clearDom = function () {
    var p = this.el && this.el.parentNode
    p && p.removeChild(this.el)
}

View.prototype.destroy = function () {
    this.clearDom()
    this.emit('destroy')
}

View.prototype.render = function (el) {
    this.el = el || this.html.cloneNode(true)
    this.emit('bind')
}

View.prototype.on('bind', function () {
    this.forEachPoint(function (type, param, path, filters, el) {
        var p = this.createPoint(type, param, el); if (!p) return
        for (var i = 0; i < filters.length; i++) {
            p = this.onfilter(filters[i], p)
        }
        this.onbind(p, type, path)
    })
})

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
        bind.call(this, point, type, path)
        return
    }

    bind = this['bind_' + type]
    if (bind) {
        bind.call(this, point, path)
        return
    }

    bind = this['bind_at_' + path]
    if (bind) {
        bind.call(this, point, type, path)
        return
    }

    this.bindPoint(point, path)
}

View.prototype.bindPoint = function (point, path) {
    var p = this.parsePath(path)
    var self = this

    point.onchange && point.onchange(function push () {
        var m = self.getModel(p.model)
        m && m.set(p.attr, point.get())
    })

    function pull () {
        var m = self.getModel(p.model)
        point.set(m && m.get(p.attr))
    }

    this.onmodel(p.model, 'change:' + p.attr, pull)
    this.onmodel(p.model, 'reset', pull)
    this.on('attach' + p.model, pull)
    pull()
}

View.prototype.onmodel = function (p, event, fn) {
    if (typeof event != 'string') {
        fn = event
        event = p
        p = ''
    }
    fn && this.on('model' + p + ':' + event, fn)

    var getListener = '_get_onmodel_' + p

    if (this[getListener]) return

    this[getListener] = function () {
        var self = this
        var listener = '_onmodel_' + p

        if (this[listener]) return this[listener]

        return this[listener] = function (ev) {
            ev = 'model' + p + ':' + ev
            self.emit.apply(self, arguments)
        }
    }

    this.on('attach' + p, function (m) {
        m.onevent(this[getListener]())
    })

    this.on('detach' + p, function (m) {
        m.offevent(this[getListener]())
    })

    this.getModel(p) && this.getModel(p).onevent(this[getListener]())
}


View.prototype.parsePath = function (path) {
    var m = /((.*)\.)?([^\.]+)$/.exec(path)
    return new Path(m[2] || '', m[3])
}

function Path (model, attr) {
    this.model = model
    this.attr = attr
}


View.prototype.bind_event = function (point, path) {
    var self = this
    point.onevent(function (e) {
        self.emit('domevent', path, e)
    })
}

View.prototype.on('domevent', function (path, e) {
    var fn = this[path]
    if (fn) return fn.call(this, e)
    var p = this.parsePath(path)
    var m = this.getModel(p.model)
    m && m[p.attr] && m[p.attr].call(m)
})
