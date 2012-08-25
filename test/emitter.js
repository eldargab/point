var sinon = require('sinon')
var Emitter = require('../lib/emitter')

describe('Emitter', function () {
    var l, l2, l3, ee

    beforeEach(function () {
        l = sinon.spy()
        l2 = sinon.spy()
        l3 = sinon.spy()
        ee = new Emitter
    })

    it('Emits events', function () {
        ee.on('hello', l).emit('hello', 1, 2)
        l.calledOnce.should.be.true
        l.calledWithExactly(1, 2).should.be.true
        l.calledOn(ee).should.be.true

        ee.on('hello', l2)
        ee.emit('hello')
        l2.calledOnce.should.be.true
        l.calledTwice.should.be.true
    })

    it('Allows to unsubscribe from event', function () {
        ee.on('foo', l).off('foo', l).emit('foo')
        l.called.should.be.false
    })

    it('Listeners are inherited through prototype chain', function () {
        var ee2 = Object.create(ee)
        ee.on('foo', l)
        ee2.on('foo', l2)
        ee2.emit('foo')

        l.calledOn(ee2).should.be.true
        l2.calledOn(ee2).should.be.true
        l.calledOn(ee).should.be.false

        ee.emit('foo')
        l.calledOn(ee).should.be.true
        l2.calledOn(ee).should.be.false
    })

    it('.onevent() subscribes to all events', function () {
        ee.onevent(l)
        ee.emit('hi', 'hi')
        l.calledOn(ee).should.be.true
        l.calledWithExactly('hi', 'hi').should.be.true
    })

    it('.offevent()', function () {
        ee.onevent(l).offevent(l).emit('hi')
        l.called.should.be.false
    })

    it('The `event` property is set to the current event name', function () {
        var calls = ''

        ee.on('foo', function () {
            this.event.should.equal('foo')
            this.event = 'bar'
            calls += '1'
        })

        ee.on('foo', function () {
            this.event.should.equal('foo')
            calls += '2'
        })

        ee.emit('foo')
        calls.should.equal('12')
    })

    it('.setListener()', function () {
        ee.on('foo', l)
        ee = Object.create(ee)
        ee.on('foo', l2)
        var ee2 = Object.create(ee)
        ee2.setListener('foo', l3).emit('foo')
        l3.calledOnce.should.be.true
        l2.called.should.be.false
        l.called.should.be.false

        ee.setListener('foo').emit('foo')
        l2.called.should.be.false
        l.called.should.be.false
    })
})