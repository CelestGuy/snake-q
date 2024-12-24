class Vector {
    /**
     * @param {Number} x 
     * @param {Number} y 
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * @param {Vector} v
     */
    add(v) {
        return new Vector(this.x + v.x, this.y + v.y);
    }

    /**
     * @param {Vector} v
     */
    sub(v) {
        return new Vector(this.x - v.x, this.y - v.y);
    }

    hash() {
        return JSON.stringify(this);
    }

    equals(other) {
        if (other instanceof Vector) {
            return other.x === this.x && other.y === this.y;
        }
        return false;
    }

    /**
     * @param {AABB} aabb 
     * @returns 
     */
    static random(aabb) {
        return new Vector(random(aabb.min.x, aabb.max.x), random(aabb.min.y, aabb.max.y));
    }

    static maxSafeInteger() {
        return new Vector(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
    }

    static minSafeInteger() {
        return new Vector(Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER);
    }

    static from(jsonStr) {
        let v = JSON.parse(jsonStr);
        return new Vector(Number(v.x), Number(v.y));
    }
}

class VectorStack {
    #stack;

    constructor(...vectors) {
        this.#stack = [];
        for (const v of vectors) {
            this.#stack.push(v.hash());
        }
    }

    has(vector) {
        return this.#stack.includes(vector.hash());
    }

    add(vector) {
        this.#stack.push(vector.hash());
    }

    shift() {
        return this.#stack.shift();
    }

    last() {
        return this.#stack[this.#stack.length - 1];
    }

    array() {
        return this.#stack;
    }
}

class AABB {
    /**
     * @param {Vector} min 
     * @param {Vector} max 
     */
    constructor(min, max) {
        this.min = min;
        this.max = max;
    }

    /**
     * @param {Vector} v 
     * @returns
     */
    intersects(v) {
        return v.x >= this.min.x && v.y >= this.min.y && v.x <= this.max.x && v.y <= this.max.y;
    }

    width() {
        return this.max.x - this.min.x;
    }

    height() {
        return this.max.y - this.min.y;
    }

    static maxSafeInteger() {
        return new AABB(Vector.minSafeInteger(), Vector.maxSafeInteger());
    }
}

const Direction = Object.freeze({
    UP: Object.freeze(new Vector(0, -1)),
    DOWN: Object.freeze(new Vector(0, 1)),
    LEFT: Object.freeze(new Vector(-1, 0)),
    RIGHT: Object.freeze(new Vector(1, 0))
});

const KeyMap = Object.freeze({
    "90": Object.freeze(Direction.UP),
    "81": Object.freeze(Direction.LEFT),
    "83": Object.freeze(Direction.DOWN),
    "68": Object.freeze(Direction.RIGHT)
});

function clamp(min, max, val) {
    return Math.min(Math.max(min, val), max);
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}