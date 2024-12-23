const SNAKE_COLOR = "#0b0";
const FRUIT_COLOR = "#e02";
const WALL_COLOR = "#ccc";

const BOARD_RANGE = new AABB(
    new Vector(0, 0),
    new Vector(32, 32)
);

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
        this.fruits = new VectorSet();
        this.walls = new VectorSet();
    }

    randomPosition() {
        let pos;

        do {
            pos = Vector.random(this.range);
        } while(this.snake.has(pos) || this.fruits.has(pos) || this.walls.has(pos));

        return pos;
    }

    addFruit(pos = this.randomPosition()) {
        this.fruits.add(pos);
    }

    addWall(pos = this.randomPosition()) {
        this.walls.add(pos);
    }
}

class Game {
    /**
     * @type {Board}
     */
    board;
    /**
     * @type {Function}
     */
    onDead;

    init() {
        this.stop();
        this.board = new Board(BOARD_RANGE);
        this.board.addFruit();
        this.render();
    }
    
    start() {
        this.init();

        let game = this;
        this.onDead = function() {
            game.stop();
            game.init();
            game.start();
        }

        this.run();
    }

    run() {
        this.stop();

        let b = this;
        this.interval = setInterval(() => {
            b.update();
            b.render();
        }, 16);
    }

    stop() {
        if (this.interval > 0) {
            clearInterval(this.interval);
            this.interval = -1;
        }
    }

    update() {
        const lastPosition = Vector.from(this.board.snake.body.last());
        const newPosition = lastPosition.add(this.board.snake.direction);

        if (!this.board.snake.has(newPosition) && !this.board.walls.has(newPosition) && this.board.range.intersects(newPosition)) {
            const onFruit = this.board.fruits.has(newPosition);

            if (onFruit) {
                this.board.snake.grow();
                this.board.fruits.delete(newPosition);
                this.board.addFruit();
            }

            this.board.snake.move();
        } else if (this.onDead && typeof this.onDead === "function") {
            //console.log("dead");
            this.onDead();
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
        
        for (let positionJson of this.board.walls.values()) {
            const position = Vector.from(positionJson);
            ctx.fillStyle = WALL_COLOR;
            ctx.fillRect(position.x * cellWidth, position.y * cellHeight, cellWidth, cellHeight);
        }
        
        for (let positionJson of this.board.fruits.values()) {
            const position = Vector.from(positionJson);
            ctx.fillStyle = FRUIT_COLOR;
            ctx.fillRect(position.x * cellWidth, position.y * cellHeight, cellWidth, cellHeight);
        }
    }
}

const game = new Game();

(function() {
    game.init();

    window.onkeydown = (keyEvent) => {
        const direction = KeyMap[keyEvent.keyCode.toString()];

        if (direction != null) {    
            game.board.snake.direction = direction;
        }
    };

    document.getElementById("startButton").onclick = () => { game.start() };
    document.getElementById("runButton").onclick = () => { game.run() };
    document.getElementById("stopButton").onclick = () => { game.stop() };
})();