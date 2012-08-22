var util = require('./util')
var guid = util.guid

module.exports = Emitter

function Emitter () {}

Emitter.extend = function (Klass) {
    Klass = Klass || function () {}
    return util.extend(Klass, this)
}

Emitter.prototype.on = function (event, handler) {
    var h = this._createHandlers(event)
    h[guid(handler)] = handler
    return this
}

Emitter.prototype._createHandlers = function (event) {
    var key = '__event_' + event
    var h = this[key]
    if (!h) return this[key] = Object.create(null, {__evt_proto: {value: this}})
    if (h.__evt_proto === this) return h
    return this[key] = Object.create(this[key], {__evt_proto: {value: this}})
}

Emitter.prototype.off = function (event, handler) {
    delete this._createHandlers(event)[guid(handler)]
    return this
}

Emitter.prototype.onevent = function (handler) {
    return this.on('__ev__', handler)
}

Emitter.prototype.offevent = function (handler) {
    return this.off('__ev__', handler)
}

Emitter.prototype.emit = function (event, var_args) {
    if (this.__event___ev__) {
        for (var k in this.__event___ev__) {
            this.__event___ev__[k].apply(this, arguments)
        }
    }
    var handlers = this['__event_' + event]
    if (!handlers) return
    var args = Array.prototype.slice.call(arguments, 1)
    for (var key in handlers) {
        this.event = event
        handlers[key].apply(this, args)
    }
}

Emitter.prototype.use = util.use