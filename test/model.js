var Model = require('../lib/model')
var sinon = require('sinon')

describe('Model', function () {
    var m, l

    beforeEach(function () {
        m = new Model
        l = sinon.spy()
    })

    it('Supports getting and setting of attributes', function () {
        m.set('foo', 'foo')
        m.get('foo').should.equal('foo')

        m.set({
            foo: 'bar',
            hello: 'world'
        })

        m.get('foo').should.equal('bar')
        m.get('hello').should.equal('world')
    })

    it('Emits `change` event when property is set', function () {
        m.on('change:foo', l)
        m.set('foo', 'foo')
        l.calledOnce.should.be.true
        m.set('foo', 'foo')
        l.calledTwice.should.be.true
    })
})