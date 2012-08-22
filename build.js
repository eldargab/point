var Bundle = require('exposer').Bundle

Bundle('index.js', function () {
    this.add('.', 'lib', {as: 'point'})

    this.includeRequire()

    this.on('out', function () {
        this.out = 'var req = (function () {\n'
            + this.out + '\n'
            + 'return require\n'
            + '})()\n'
    })

    this.append([
        'if (typeof define == "function" && define.amd) {',
        '  define("point", ["jquery"], function (jquery) {',
        '    req.register("jquery", function (module) {',
        '      module.exports = jquery',
        '    })',
        '    return req("point")',
        '  })',
        '} else if (typeof module != "undefined" && module.exports) {',
        '  req.register("jquery", function (module) {',
        '    module.exports = require("jquery")',
        '  })',
        '  module.exports = req("point")',
        '} else {',
        '  req.register("jquery", function (module) { module.exports = $ })',
        '  window.Point = req("point")',
        '}'
    ].join('\n'))

    this.closure()
})