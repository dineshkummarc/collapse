(function () {
	var game, engine, board;

	/* Actual game */
	game = (function () {
		var width, height, board, colors;
		width = 400;
		height =  400;

		function rand(min, max) {
			return min + Math.floor(Math.random() * (max - min));
		}

		function createArray(size, defaultValue) {
			var defaultValue = defaultValue || 0;
			return new Array(size).join('x').split('x').map(function () {
				return defaultValue;
			});
		}

		function createBoard(columns, rows, size) {
			return createArray(columns * rows).map(function (value, key) {
				return ({
					x: (key % columns) * size,
					y: Math.floor(key / rows) * size,
					type: rand(0, colors.length),
					size: size
				});
			});
		}

		function start(ctx) {
			colors = ['#f00', '#0c0', '#00f', '#dd0', '#0af', '#f0f'].map(function (color) {
				var gradient = ctx.createLinearGradient(0, 0, 10, 10);
				gradient.addColorStop(0, '#fff');
				gradient.addColorStop(.25, '#fff');
				gradient.addColorStop(1, color);

				return gradient;
			});

			reset();
		}
		
		function reset(ctx) {

			board = createBoard(20, 20, 20);
		}

		function update(ms) {
		}

		function render(ctx) {
			board.forEach(function (tile) {
				ctx.save();
				ctx.translate(tile.x, tile.y);
				ctx.fillStyle = colors[tile.type];
				ctx.fillRect(0, 0, tile.size, tile.size);
				ctx.restore();
			});
		}

		return ({
			width: width,
			height: height,
			update: update,
			render: render,
			start: 	start,
			mousedown: function (x, y) {
			}
		});
	}());

	/* Engine (timing, events, browser setup) */
	engine = (function () {
		var lastUpdate, now, ctx;
		
		Date.now = Date.now || (function () {
			return new Date().getTime();
		}());
		
		/* Create canvas/drawing context */
		ctx = (function () {
			var canvas = document.createElement('canvas');
			canvas.width = game.width;
			canvas.height = game.height;
			document.body.appendChild(canvas);

			/* Mouse event for canvas */
			if (typeof game.mousedown === 'function') {
				canvas.addEventListener('mousemove', function (e) {
					var x, y;
					x = e.offsetX;
					y = e.offsetY;

					if (typeof x === 'undefined' || typeof y === 'undefined') {
						/* Stupid Firefox ... */
						x = e.pageX - canvas.offsetLeft;
						y = e.pageY - canvas.offsetTop;
					}

					return game.mousedown(x, y);
				}, false);
			}
			
			return canvas.getContext('2d');
		}());
		window.ctx = ctx;

		/* Update/render loop */
		lastUpdate = Date.now();
		function loop() {
			now = Date.now();
			game.update(lastUpdate-now);
			game.render(ctx);
			lastUpdate = Date.now();
			setTimeout(loop, 40);
		}

		return ({
			start: function () {
				game.start(ctx);
				loop();
			}
		});
	}());

	engine.start();
}());
