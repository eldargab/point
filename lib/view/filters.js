
exports.not = function (point) {
    var get = point.get
    var set = point.set

    point.get = function () {
        return !get.call(this)
    }

    point.set = function (val) {
        set.call(this, !val)
    }

    return point
}


exports.stop = function (eventPoint) {
    eventPoint.onevent(stop)
    return eventPoint
}

function stop (e) {
    e.preventDefault()
    e.stopPropagation()
}