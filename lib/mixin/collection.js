var guid = require('../util').guid

var proto = exports

proto.add = function (obj) {
    var objects = this._objects || (this._objects = {})
    objects[guid(obj)] = obj
    this.length++
    this.emit('add', obj)
    this.emit('_change_:length')
    this.emit('change:length')
    return this
}

proto.remove = function (obj) {
    if (!this._objects) return
    var id = guid(obj)
    if (!this._objects[id]) return
    delete this._objects[id]
    this.length--
    this.emit('remove', obj)
    this.emit('_change_:length')
    this.emit('change:length')
    return this
}

proto.forEach = function (cb, ctx) {
    ctx = ctx || this
    for (var key in this._objects) {
        cb.call(ctx, this._objects[key])
    }
    return this
}

proto.onget_length = function () {
    return this.length
}

proto.length = 0