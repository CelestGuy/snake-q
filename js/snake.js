const SNAKE_COLOR = "#0b0";
const FRUIT_COLOR = "#e02";

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
    }

    randomPosition() {
        let pos;

        do {
            pos = Vector.random(this.range);
        } while(this.snake.has(pos) || this.fruits.has(pos));

        return pos;
    }

    addFruit(pos = this.randomPosition()) {
        this.fruits.add(pos);
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
        this.fruitCount = 1;
        this.gameLoopTime = 125;
        this.updateModal();
    }

    reset() {
        this.stop();
        this.board = new Board(BOARD_RANGE);

        for (let i = 0; i < this.fruitCount; i++) {
            this.board.addFruit();
        }

        this.render();
    }

    play() {
        this.stop();

        let b = this;
        this.interval = setInterval(() => {
            b.update();
            b.render();
        }, this.gameLoopTime);
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

        if (!this.board.snake.has(newPosition) && this.board.range.intersects(newPosition)) {
            const onFruit = this.board.fruits.has(newPosition);

            if (onFruit) {
                this.board.snake.grow();
                this.board.fruits.delete(newPosition);
                this.board.addFruit();
            }

            this.board.snake.move();
        } else {
            console.log("Game over!");
            this.stop();
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

        for (let positionJson of this.board.fruits.values()) {
            const position = Vector.from(positionJson);
            ctx.fillStyle = FRUIT_COLOR;
            ctx.fillRect(position.x * cellWidth, position.y * cellHeight, cellWidth, cellHeight);
        }
    }

    updateModal() {
        document.querySelector("input[name=fruitCount]").value = this.fruitCount;
        document.querySelector("input[name=gameLoopTime]").value = this.gameLoopTime;
    }

    setSettings(settingsFormData) {
        console.log(settingsFormData);
        this.fruitCount = Number(settingsFormData.get("fruitCount"));
        this.gameLoopTime = Number(settingsFormData.get("gameLoopTime"));
        console.log(this);
    }

    static getInstance() {
        if (Game.#instance == null) {
            Game.#instance = new Game();
        }

        return Game.#instance;
    }
}

(function() {
    Game.getInstance().reset();

    window.onkeydown = (keyEvent) => {
        const direction = KeyMap[keyEvent.keyCode.toString()];

        const game = Game.getInstance();
        if (direction != null) {    
            game.board.snake.direction = direction;
        }
    };
})();