module.exports = Html

function Html (el) {
    this.el = el
}

Html.prototype.get = function () {
    return this.el.innerHTML
}

Html.prototype.set = function (html) {
    this.el.innerHTML = html
}