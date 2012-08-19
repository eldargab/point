var sinon = require('sinon')
var Lib = require('../lib')

describe('Collection @mixin', function () {
    var Collection = Lib.Model.extend().use('collection')
    var coll, l, o, o1, o2

    beforeEach(function () {
        coll = new Collection
        l = sinon.spy()
        o = {}
        o1 = {}
        o2 = {}
    })

    it('Emits `add` event when new object was added', function () {
        coll.on('add', l)
        coll.add(o)
        l.calledWithExactly(o).should.be.true
    })

    it('Emits `remove` event when object was removed', function () {
        coll.on('remove', l)
        coll.add(o).add(o1)
        coll.remove(o)
        l.calledWithExactly(o).should.be.true
    })

    it('Supports enumeration with .forEach()', function () {
        coll.add(o).add(o1).add(o2)
        coll.forEach(l)
        l.calledOn(coll).should.be.true
        l.calledWithExactly(o).should.be.true
        l.calledWithExactly(o1).should.be.true
        l.calledWithExactly(o2).should.be.true
        l.calledThrice.should.be.true

        coll.forEach(l, o)
        l.calledOn(o).should.be.true
    })

    it('Supports `length` property', function () {
        coll.length.should.equal(0)
        coll.add(o)
        coll.length.should.equal(1)
        coll.get('length').should.equal(1)
        coll.on('change:length', l)
        coll.add(o1)
        l.calledOnce.should.be.true
    })
})