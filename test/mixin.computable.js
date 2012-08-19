var sinon = require('sinon')
var Lib = require('../lib')

describe('Computable @mixin', function () {
    it('Adds support for computable properties', function (done) {
        var Model = Lib.Model.extend()
        var computable = Lib.mixin('computable')
        var onchange = sinon.spy()

        Model.use(computable, 'greeting', ['change:hello', 'change:world'], function () {
            return this.get('hello') + ' ' + this.get('world')
        })

        var m = new Model

        m.on('change:greeting', onchange)

        m.set({
            hello: 'Hi',
            world: 'world'
        })

        m.get('greeting').should.equal('Hi world')

        m.set('hello', 'Hello')

        m.get('greeting').should.equal('Hello world')

        onchange.called.should.be.false

        setTimeout(function () {
            onchange.calledOnce.should.be.true
            done()
        }, 10)
    })
})