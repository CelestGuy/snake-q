/**
 * @param {HTMLFormElement} form
 */
function newQLearningTraining(form) {
    const formData = new FormData(form);

    const qLearning = QLearning.getInstance();
    qLearning.epsilon = Number(formData.get("epsilon"));
    qLearning.learningRate = Number(formData.get("learningRate"));
    qLearning.discountFactor = Number(formData.get("discountFactor"));
    qLearning.maxIterations = Number(formData.get("maxIterations"));

    qLearning.initQTable();

    setTimeout(() => {
        qLearning.train();
    }, 1);
}

/**
 * @param {HTMLFormElement} form
 */
function setGameSettings(form) {
    const settingsFormData = new FormData(form);
    const game = Game.getInstance();

    game.gameLoopTime = Number(settingsFormData.get("gameLoopTime"));
}

function renderState(s) {
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

function renderAction(a) {
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

(function() {
    const game = Game.getInstance();
    const qLearning = QLearning.getInstance();

    game.reset();
    game.start();

    window.onkeydown = (keyEvent) => {
        const direction = KeyMap[keyEvent.keyCode.toString()];

        if (direction != null) {
            game.board.snake.direction = direction;
        }
    };

    setInterval(() => {
        const running = document.querySelector("input[name=playing]:checked").value;
        const decide = document.querySelector("input[name=decide]").checked;

        const state = getState(Game.getInstance().board);
        renderState(state);

        let direction = game.board.snake.direction;

        if (running && decide) {
            let max = Number.MIN_VALUE;

            for (let dir of Object.values(Direction)) {
                const v = qLearning.Q(state, dir);

                if (max < v) {
                    max = v;
                    direction = dir;
                }
            }

            game.board.snake.direction = direction;
        }

        renderAction(direction);
    }, 1);
})();