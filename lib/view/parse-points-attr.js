module.exports = function parse (attr, onpoint) {
    attr.split(/,/g).forEach(function (binding) {
        var b = binding.split(/:/g)
        if (b.length != 2) return

        var path = b[1].trim()
        var p = b[0].split(/\|/g)
        var point = p[0].trim().split(/\-/)
        var type = point[0]
        var param = point[1]
        if (param) param = param.trim()
        var filters = p.slice(1).map(function (s) { return s.trim() })

        onpoint(type, param, path, filters)
    })
}