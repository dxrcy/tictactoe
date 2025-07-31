const PLAYER_NONE = 0;
const PLAYER_YOU = 1;
const PLAYER_BOT = 2;

const SYMBOL_SIZE = 0.7;

const COLORS = {
	BACKGROUND: "#fffaf8",
	BORDER: "#221111",
	HOVER_AVAILABLE: "#f6f0aa",
	HOVER_UNAVAILABLE: "#f6f0ee",
	TILE_YOU: "#cc2244",
	TILE_BOT: "#2244cc",
	WIN_YOU: "#00ff0033",
	WIN_BOT: "#ff000033",
	WIN_DRAW: "#ffff0044",
};

const state = {
	board: null,
	cursor: null,
	turn: null,
	winner: null,
};

const input = {
	keys: {},
	mouse: null,
	button: false,
};

function reset() {
	state.board = [];
	for (let y = 0; y < 3; ++y) {
		state.board[y] = [];
		for (let x = 0; x < 3; ++x) {
			state.board[y][x] = PLAYER_NONE;
		}
	}

	state.cursor = null;
	state.turn = PLAYER_YOU;
	state.winner = null;
}

function render() {
	ctx.fillStyle = COLORS.BACKGROUND;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	if (state.cursor !== null) {
		const isAvailable =
			state.turn == PLAYER_YOU
			&& state.board[state.cursor.y][state.cursor.x] == PLAYER_NONE;
		ctx.fillStyle = isAvailable ? COLORS.HOVER_AVAILABLE : COLORS.HOVER_UNAVAILABLE;
		ctx.fillRect(
			canvas.width / 3 * state.cursor.x,
			canvas.height / 3 * state.cursor.y,
			canvas.width / 3,
			canvas.height / 3,
		);
	}

	ctx.strokeStyle = COLORS.BORDER;
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(canvas.width / 3, 0);
	ctx.lineTo(canvas.width / 3, canvas.height);
	ctx.moveTo(canvas.width * 2 / 3, 0);
	ctx.lineTo(canvas.width * 2 / 3, canvas.height);
	ctx.moveTo(0, canvas.height / 3);
	ctx.lineTo(canvas.width, canvas.height / 3);
	ctx.moveTo(0, canvas.height * 2 / 3);
	ctx.lineTo(canvas.width, canvas.height * 2 / 3);
	ctx.stroke();

	for (let y = 0; y < 3; ++y) {
		for (let x = 0; x < 3; ++x) {
			const tile = state.board[y][x];

			const cx = canvas.width / 3 * (x + 0.5);
			const cy = canvas.height / 3 * (y + 0.5);
			const size = canvas.width / 3 / 2 * SYMBOL_SIZE;

			ctx.lineWidth = 4;
			ctx.lineCap = "round";
			if (tile == PLAYER_YOU) {
				ctx.strokeStyle = COLORS.TILE_YOU;
				ctx.beginPath();
				ctx.moveTo(cx - size, cy - size);
				ctx.lineTo(cx + size, cy + size);
				ctx.moveTo(cx - size, cy + size);
				ctx.lineTo(cx + size, cy - size);
				ctx.stroke();
			} else if (tile == PLAYER_BOT) {
				ctx.strokeStyle = COLORS.TILE_BOT;
				ctx.beginPath();
				ctx.arc(cx, cy, size, size, 9, 2 * Math.PI);
				ctx.stroke();
			}
		}
	}

	if (state.winner !== null) {
		const color =
			(state.winner === PLAYER_YOU) ? COLORS.WIN_YOU
			: (state.winner === PLAYER_BOT) ? COLORS.WIN_BOT
			: COLORS.WIN_DRAW;
		ctx.fillStyle = color;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	}
}

function update(delta) {
	if (state.winner !== null) {
		if (input.button) {
			input.button = false;
			reset();
		}
		return;
	}

	if (input.mouse !== null) {
		state.cursor = {
			x: Math.floor(input.mouse.x / (canvas.width / 3)),
			y: Math.floor(input.mouse.y / (canvas.height / 3)),
		};
	} else {
		state.cursor = null;
	}

	if (input.button && state.cursor !== null) {
		input.button = false;
		if (state.turn == PLAYER_YOU) {
			if (state.board[state.cursor.y][state.cursor.x] == 0) {
				state.turn = PLAYER_BOT;
				state.board[state.cursor.y][state.cursor.x] = PLAYER_YOU;
			}
		} else {
			state.turn = PLAYER_YOU;
			stepBotPlayer();
		}
	}

	const winner = checkWin();
	if (winner !== null) {
		state.winner = winner;
		state.turn = 0;
	}
}

function checkWin() {
	if (isPlayerWin(state.board, PLAYER_YOU)) {
		return PLAYER_YOU;
	}
	if (isPlayerWin(state.board, PLAYER_BOT)) {
		return PLAYER_BOT;
	}
	if (isDraw(state.board)) {
		return PLAYER_NONE;
	}
	return null;
}

function isPlayerWin(board, player) {
	for (let y = 0; y < 3; ++y) {
		if (
			board[y][0] === player
			&& board[y][1] === player
			&& board[y][2] === player
		) {
			return true;
		}
	}
	for (let x = 0; x < 3; ++x) {
		if (
			board[0][x] === player
			&& board[1][x] === player
			&& board[2][x] === player
		) {
			return true;
		}
	}
	if (
		board[0][0] === player
		&& board[1][1] === player
		&& board[2][2] === player
	) {
		return true;
	}
	if (
		board[0][2] === player
		&& board[1][1] === player
		&& board[2][0] === player
	) {
		return true;
	}
	return false;
}

function isDraw(board) {
	for (let y = 0; y < 3; ++y) {
		for (let x = 0; x < 3; ++x) {
			if (board[y][x] === 0) {
				return false;
			}
		}
	}
	return true;
}

function stepBotPlayer() {
	// TODO(feat): If no immediate win/block, place tile 'next to' existing opposite tile
	const bestTile = findWinningMove(PLAYER_BOT) ?? findWinningMove(PLAYER_YOU) ?? randomTile();
	assert(bestTile !== null, "no available tiles for bot");
	const [x, y] = bestTile;
	assert(state.board[y][x] === PLAYER_NONE, "bot tried to override tile");
	state.board[y][x] = PLAYER_BOT;
	return;
}

function findWinningMove(player) {
	for (let y = 0; y < 3; ++y) {
		for (let x = 0; x < 3; ++x) {
			if (state.board[y][x] !== PLAYER_NONE) {
				continue;
			}
			const board = copyBoard(state.board);
			board[y][x] = player;
			if (isPlayerWin(board, player)) {
				return [x, y];
			}
		}
	}
	return null;
}

function randomTile() {
	const available = [];
	for (let y = 0; y < 3; ++y) {
		for (let x = 0; x < 3; ++x) {
			if (state.board[y][x] === PLAYER_NONE) {
				available.push([x, y]);
			}
		}
	}
	if (available.length === 0) {
		return null;
	}
	const index = Math.floor(Math.random() * available.length);
	return available[index];
}

function copyBoard(board) {
	const copy = [];
	for (let y = 0; y < 3; ++y) {
		copy[y] = [];
		for (let x = 0; x < 3; ++x) {
			copy[y][x] = board[y][x];
		}
	}
	return copy;
}

function assert(condition, message) {
	if (!condition) {
		throw "assertion failed: " + message;
	}
}

const canvas = document.createElement("canvas");
canvas.width = 512;
canvas.height = 512;
const ctx = canvas.getContext("2d");
document.body.appendChild(canvas);
function main() {
	const now = Date.now();
    render();
    update((now - then) / 1000);
    then = now;
	requestAnimationFrame(main);
}
var then = Date.now();
reset();
main();

document.addEventListener("keydown", (event) => {
	input.keys[event.code] = true;
});
document.addEventListener("keyup", (event) => {
	delete input.keys[event.code];
});
canvas.addEventListener("mousemove", (event) => {
	const rect = canvas.getBoundingClientRect();
	input.mouse = {
		x: event.clientX - rect.left,
		y: event.clientY - rect.top,
	};
});
canvas.addEventListener("mouseout", (event) => {
	input.mouse = null;
});
canvas.addEventListener("mousedown", (event) => {
	if (event.button === 0) {
		input.button = true;
	}
});
canvas.addEventListener("mouseup", (event) => {
	if (event.button === 0) {
		input.button = false;
	}
});

