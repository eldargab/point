var parse = require('../lib/view/data-bind-syntax')
var should = require('should')

describe('data-bind syntax', function () {
    it('Should parse', function (done) {
        var call = 1
        parse(
        'css-available enabled|not : model.notAvailable, value: value',
        function (type, param, path, filters) {
            if (call == 1) {
                type.should.equal('css')
                param.should.equal('available enabled')
                filters.should.eql(['not'])
                path.should.equal('model.notAvailable')
            } else if (call == 2) {
                type.should.equal('value')
                path.should.equal('value')
                should.ok(param === undefined, 'Parameter should be undefined')
                filters.should.eql([])
                done()
            } else {
                should.throw('There is only to endpoints, but was found more')
            }
            call++
        })
    })

    it('Should trim names', function (done) {
        parse(' type-param  | f1 | f2 | f3  : path ', function (type, param, path, filters) {
            type.should.equal('type')
            param.should.equal('param')
            filters.should.eql(['f1', 'f2', 'f3'])
            path.should.equal('path')
            done()
        })
    })
})