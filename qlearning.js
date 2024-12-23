const FRUIT = 100;
const ALIVE = 1;
const DEAD = -100;

const stateRange = new AABB(new Vector(-1, -1), new Vector(1, 1));

class State {
    constructor() {
        this.array = [];

        for (let i = 0; i < 3; i++) {
            this.array[i] = [];
            for (let j = 0; j < 3; j++) {
                this.array[i][j] = 0;
            }
        }
    }

    setValue(position, value) {
        this.array[1 + position.y][1 + position.x] = value;
    }

    getValue(position) {
        if (stateRange.intersects(position))
            return this.array[1 + position.y][1 + position.x];

        return Number.NaN;
    }

    hash() {
        return JSON.stringify(this);
    }
}

class QLearning {
    static instance;

    constructor(epsilon, learningRate, discountFactor, maxIterations) {
        this.epsilon = epsilon;
        this.learningRate = learningRate;
        this.discountFactor = discountFactor;
        this.maxIterations = maxIterations;

        this.training = false;

        /**
         * @type {Map<String, Map<String, Number>>}
         */
        this.qMap = new Map();

        QLearning.instance = this;
    }

    initQTable() {
        const l = 9;
        const b = 3;

        let total = Math.pow(b, l);

        for (let i = 0; i < total; i++) {
            let temp = i;

            let state = new State();

            for (let k = l - 1; k >= 0; k--) {
                const y = Math.floor(k / 3);
                const x = k % 3;
                state.array[y][x] = (temp % b);
                temp = Math.floor(temp / b);
            }

            let aMap = new Map();

            for (let a of Object.values(Direction)) {
                aMap.set(a.hash(), 0);
            }

            this.qMap.set(state.hash(), aMap);
        }
    }

    Q(state, action, value) {
        if (value) {
            this.qMap.get(state.hash()).set(action.hash(), value);
        } else {
            return this.qMap.get(state.hash()).get(action.hash());
        }
    }

    max(state) {
        let action;
        let m = Number.NEGATIVE_INFINITY;

        for (const dir of Object.values(Direction)) {
            let v = this.Q(state, dir);

            if (m < v) {
                action = dir;
                m = v;
            }
        }

        return action;
    }

    chooseAction(state) {
        let v = Math.random();

        if (v < this.epsilon) {
            let i = Math.floor(Math.random() * 4);
            return Object.values(Direction)[i];
        } else {
            return this.max(state);
        }
    }

    train() {
        this.training = true;
        const ran = document.getElementById("a");
        const ran2 = document.getElementById("ab");
        ran.max = this.maxIterations;

        let isDead = false;
        game.onDead = () => {
            isDead = true;
        };

        game.init();

        for (let iteration = 0; iteration < this.maxIterations && this.training; iteration++) {
            ran.value = iteration;
            ran2.innerText = iteration.toString() + " / " + this.maxIterations;
            isDead = false;

            while (!isDead) {
                try {
                    let board = game.board;
                    let state = getState(board);
                    let action = this.chooseAction(state);

                    board.snake.direction = action;

                    game.update();

                    let nextState = getState(board);

                    const v = state.getValue(action);

                    let reward = ALIVE;
                    switch (v) {
                        case 0:
                            reward = ALIVE;

                            for (let i = -1; i < 2; i++) {
                                for (let j = -1; j < 2; j++) {
                                    const v1 = action.add(new Vector(j, i));
                                    if (state.getValue(v1) === 1) {
                                        reward += FRUIT / 4;
                                    }
                                }
                            }

                            break;
                        case 1:
                            reward = FRUIT;
                            break;
                        case 2:
                            reward = DEAD;
                            break;
                    }

                    let bestNextAction = this.max(nextState);
                    let value = (1 - this.learningRate) * this.Q(state, action) + this.learningRate * (reward + this.discountFactor * this.Q(nextState, bestNextAction));

                    this.Q(state, action, value);
                } catch (e) {
                    console.error(e);
                    alert(e);
                }
            }
        }

        console.log("finished training");
    }

    renderState(s) {
        /**
         * @type {HTMLCanvasElement}
         */
        const canvas = document.getElementById("stateCanvas");
        const ctx = canvas.getContext("2d");

        const cellWidth = canvas.width / 3;
        const cellHeight = canvas.height / 3;

        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const v = s.array[i][j];

                let color;
                switch (v) {
                    case 0:
                        color = "#000";
                        break;
                    case 1:
                        color = "#f00";
                        break;
                    case 2:
                        color = "#888";
                        break;
                }

                ctx.fillStyle = color;
                ctx.fillRect(j * cellWidth, i * cellHeight, cellWidth, cellHeight);
            }
        }
    }

    renderAction(a) {
        const canvas = document.getElementById("actionCanvas");
        const ctx = canvas.getContext("2d");

        const cellWidth = canvas.width / 3;
        const cellHeight = canvas.height / 3;

        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let po = a.add(new Vector(1, 1));

        ctx.fillStyle = "#fff";
        ctx.fillRect(po.x * cellWidth, po.y * cellHeight, cellWidth, cellHeight);
    }

    stop() {
        this.training = false;
    }
}

function getState(board) {
    let state = new State();

    let snakePosition = Vector.from(board.snake.body.last());

    for (let fruitHash of board.fruits.values()) {
        let fruitPosition = Vector.from(fruitHash).sub(snakePosition);

        if (stateRange.intersects(fruitPosition)) {
            state.setValue(fruitPosition, 1);
        } else {
            let pos = new Vector(clamp(-1, 1, fruitPosition.x), clamp(-1, 1, fruitPosition.y));
            state.setValue(pos, 1);
        }
    }

    for (let snakeHash of board.snake.body.array()) {
        let position = Vector.from(snakeHash).sub(snakePosition);

        if (stateRange.intersects(position)) {
            state.setValue(position, 2);
        }
    }

    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const pos = new Vector(j - 1, i - 1).add(snakePosition);

            if (!board.range.intersects(pos)) {
                state.setValue(new Vector(j - 1, i - 1), 2);
            }
        }
    }

    return state;
}


let int;

function unobserve() {
    clearInterval(int);
}

function observe() {
    unobserve();

    const instance = QLearning.instance;

    if (instance) {
        int = setInterval(() => {
            let state = getState(game.board);
            instance.renderState(state);

            let direction = null;
            let max = Number.MIN_VALUE;

            for (let dir of Object.values(Direction)) {
                const v = instance.Q(state, dir);

                if (max < v) {
                    max = v;
                    direction = dir;
                }
            }

            if (direction != null) {
                instance.renderAction(direction);
                game.board.snake.direction = direction;
            }
        }, 1);
    }
}

/**
 * @param {HTMLFormElement} form
 */
function newQLearningTraining(form) {
    const formData = new FormData(form);

    const qLearning = new QLearning(
        Number(formData.get("epsilon")),
        Number(formData.get("learningRate")),
        Number(formData.get("discountFactor")),
        Number(formData.get("maxIterations"))
    );

    qLearning.initQTable();

    setTimeout(() => {
        qLearning.train();
    }, 1);
}

function stopTraining() {
    const instance = QLearning.instance;

    if (instance != null) {
        instance.stop();
    }
}