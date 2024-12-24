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
    /**
     * @type {QLearning}
     */
    static #instance = null;

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
        this.initQTable();

        this.training = true;
        const ran = document.getElementById("a");
        const ran2 = document.getElementById("ab");
        ran.max = this.maxIterations;

        let isDead = false;

        Game.getInstance().reset();

        for (let iteration = 0; iteration < this.maxIterations && this.training; iteration++) {
            ran.value = iteration;
            ran2.innerText = iteration.toString() + " / " + this.maxIterations;
            isDead = false;

            while (!isDead) {
                try {
                    let board = Game.getInstance().board;
                    let state = getState(board);
                    let action = this.chooseAction(state);

                    board.snake.direction = action;

                    Game.getInstance().update();

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
                            isDead = true;
                            break;
                    }

                    let bestNextAction = this.max(nextState);
                    let value = (1 - this.learningRate) * this.Q(state, action) + this.learningRate * (reward + this.discountFactor * this.Q(nextState, bestNextAction));

                    this.Q(state, action, value);
                } catch (e) {
                    console.error(e);
                    alert(e.stack);
                    return;
                }
            }
        }

        console.log("finished training");
    }

    stop() {
        this.training = false;
    }

    static getInstance() {
        if (QLearning.#instance == null) {
            QLearning.#instance = new QLearning();
        }

        return QLearning.#instance;
    }
}

function getState(board) {
    let state = new State();

    let snakePosition = Vector.from(board.snake.body.last());

    const fruitPosition = board.fruit.sub(snakePosition);

    if (stateRange.intersects(fruitPosition)) {
        state.setValue(fruitPosition, 1);
    } else {
        let pos = new Vector(clamp(-1, 1, fruitPosition.x), clamp(-1, 1, fruitPosition.y));
        state.setValue(pos, 1);
    }

    for (let snakeHash of board.snake.body.array()) {
        let position = Vector.from(snakeHash).sub(snakePosition);

        if (stateRange.intersects(position)) {
            state.setValue(position, 2);
        }
    }

    for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
            const pos = new Vector(j, i);

            if (!board.range.intersects(pos.add(snakePosition))) {
                state.setValue(pos, 2);
            }
        }
    }

    return state;
}

onmessage = function(event) {
    if (event.data.execute) {
        console.log("test : ",  JSON.stringify(event.data));
        postMessage({ data: "Bien reçu !" });
    }
}