const SNAKE_COLOR = "#0b0";
const FRUIT_COLOR = "#e02";

class Snake {
    /**
     * @param {Vector} position 
     * @param {Readonly<Direction>} direction
     */
    constructor(position, direction) {
        this.direction = direction;
        this.body = new VectorStack(position);
    }

    /**
     * @param {Vector} v 
     */
    has(v) {
        return this.body.has(v);
    }

    move() {
        this.grow();
        this.body.shift();
    }

    grow() {        
        const newPosition = Vector.from(this.body.last()).add(this.direction);
        this.body.add(newPosition);
    }

    position() {
        return this.body.last();
    }

    positions() {
        return this.body.array();
    }
}

class Board {
    constructor(range = AABB.maxSafeInteger()) {
        this.range = range;
        this.snake = new Snake(Vector.random(range), Direction.UP);
        this.fruit = null;
    }

    randomPosition() {
        let pos;

        do {
            pos = Vector.random(this.range);
        } while(this.snake.has(pos) || pos.equals(this.fruit));

        return pos;
    }

    setFruit(pos = this.randomPosition()) {
        this.fruit = pos;
    }
}

class Game {
    /**
     * @type {Game}
     */
    static #instance = null;

    /**
     * @type {Board}
     */
    board = null;

    constructor() {
        this.gameLoopTime = 125;
        this.range = new AABB(
            new Vector(0, 0),
            new Vector(16, 16)
        );
        this.updateModal();
    }

    reset() {
        this.board = new Board(this.range);
        this.board.setFruit();
    }

    start() {
        if (this.interval > 0) {
            clearInterval(this.interval);
        }

        let b = this;
        this.interval = setInterval(() => {
            const running = document.querySelector("input[name=playing]:checked").value;

            if (running === "true") {
                b.update();
            }

            b.render();
        }, this.gameLoopTime);
    }

    update() {
        const board = this.board;
        const lastPosition = Vector.from(board.snake.position());
        const newPosition = lastPosition.add(board.snake.direction);

        if (!board.snake.has(newPosition) && board.range.intersects(newPosition)) {
            const onFruit = newPosition.equals(board.fruit);

            if (onFruit) {
                board.snake.grow();
                board.setFruit();
            }

            board.snake.move();
        } else {
            console.log("Game over!");
            this.reset();
        }
    }

    render() {
        const canvas = document.getElementById("canvas");
        const ctx = canvas.getContext("2d");

        const cellWidth = canvas.width / (this.board.range.width() + 1);
        const cellHeight = canvas.height / (this.board.range.height() + 1);

        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let positionJson of this.board.snake.positions()) {
            const position = Vector.from(positionJson);
            ctx.fillStyle = SNAKE_COLOR;
            ctx.fillRect(position.x * cellWidth, position.y * cellHeight, cellWidth, cellHeight);
        }

        const fruitPosition = this.board.fruit;

        if (fruitPosition != null) {
            ctx.fillStyle = FRUIT_COLOR;
            ctx.fillRect(fruitPosition.x * cellWidth, fruitPosition.y * cellHeight, cellWidth, cellHeight);
        }
    }

    updateModal() {
        document.querySelector("input[name=gameLoopTime]").value = this.gameLoopTime;
    }

    static getInstance() {
        if (Game.#instance == null) {
            Game.#instance = new Game();
        }

        return Game.#instance;
    }
}