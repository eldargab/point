module.exports = Attr

function Attr (el, name) {
    this.el = el
    this.name = name
}

Attr.prototype.set = function (val) {
    val != null ? this.el.setAttribute(this.name, val) : this.el.removeAttribute(this.name)
}

Attr.prototype.get = function () {
    return this.el.getAttribute(this.name)
}