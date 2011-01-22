(function () {
	var game, engine, board;

	/* Actual game */
	game = (function () {
		var width, height, board, tiles, selection;
		width = 400;
		height =  450;

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
				var tile = {
					x: (key % columns) * size,
					y: Math.floor(key / rows) * size,
					type: rand(0, tiles.length),
					size: size,
					selected: false
				};

				/* Setup new "target" positions (for animation) */
				tile.tx = tile.x; // target x
				tile.ty = tile.y; // target y

				return tile;
			});
		}

		function darkenColor(color) {
			return color.replace(/[\da-f]/g, function (x) {
				return Math.max(0, parseInt(x, 16) - 7);
			});
		}

		/* Pre-render the gradient color tiles */
		function createTiles(size, colors) {
			var ctx, buffer = document.createElement('canvas');
			buffer.width = size;
			buffer.height = size;
			ctx = buffer.getContext('2d');

			return colors.map(function (color) {
				var gradient = ctx.createLinearGradient(0, 0, size, size);
				gradient.addColorStop(0, '#fff');
				gradient.addColorStop(1, color);

				ctx.fillStyle = gradient;
				ctx.fillRect(0, 0, size, size);
				ctx.strokeStyle = darkenColor(color);
				ctx.strokeWidth = 4.0;
				ctx.strokeRect(0, 0, size, size);

				return ctx.getImageData(0, 0, size, size);
			});
		}

		function reset() {
			board = createBoard(20, 20, 20);
		}

		function start() {
			tiles = createTiles(20, ['#f00', '#0c0', '#00f', '#dd0', '#0af', '#c0f']);
			selection = []; // selected tiles
			reset();
		}

		/* Convert x, y mouse coordinates to tile index */
		function pickTile(x, y) {
			var index = Math.floor(y / 20) * 20 + Math.floor(x / 20);
			if (index < 0 || index >= board.length) {
				return -1;
			}

			return index;
		}

		function mousedown(x, y) {
			var index = pickTile(x, y);
			if (index !== -1) {
				board[index].type = 2;
			}

			return false;
		}

		function mousemove(x, y) {
			var index = pickTile(x, y);
			if (index !== -1) {
				board[pickTile(x, y)].selected = true;
			}

			return false;
		}

		function update(ms) {
		}

		function render(ctx, fps) {
			board.forEach(function (tile) {
				ctx.putImageData(tiles[tile.type], tile.x, tile.y);
				if (tile.selected) {
					ctx.fillStyle = 'rgba(255, 255, 255, .5)';
					ctx.fillRect(tile.x, tile.y, tile.size, tile.size);
				}
			});

			ctx.fillStyle = '#fff';
			ctx.fillRect(0, 400, width, height);
			ctx.fillStyle = '#000';
			ctx.font = '20px calibri, verdana, tahoma, serif';
			ctx.textBaseline = 'top';
			ctx.fillText('FPS: ' + fps, 10, 410);
		}

		return ({
			width: width,
			height: height,
			update: update,
			render: render,
			start: 	start,
			mousedown: mousedown,
			mousemove: mousemove
		});
	}());

	/* Engine (timing, events, browser setup) */
	engine = (function () {
		var lastUpdate, now, delta, fpsTimer = 0, fps = 0, frames = 0, ctx;
		
		Date.now = Date.now || (function () {
			return new Date().getTime();
		}());
		
		/* Create canvas/drawing context */
		ctx = (function () {
			var canvas = document.createElement('canvas');
			canvas.width = game.width;
			canvas.height = game.height;
			document.body.appendChild(canvas);

			/* Prevent annoying text-selection when clicking quickly */
			canvas.addEventListener('selectstart', function (e) {
				e.preventDefault();
				return false;
			}, false);

			/* Mouse events for canvas */
			['mousedown', 'mousemove'].forEach(function (event) {
				if (typeof game[event] === 'function') {
					canvas.addEventListener(event, function (e) {
						var x, y;
						x = e.offsetX;
						y = e.offsetY;

						if (typeof x === 'undefined' || typeof y === 'undefined') {
							/* Stupid Firefox ... */
							x = e.pageX - canvas.offsetLeft;
							y = e.pageY - canvas.offsetTop;
						}

						return game[event](x, y);
					}, false);
				}
			});
			
			return canvas.getContext('2d');
		}());
		window.ctx = ctx;

		/* Update/render loop */
		lastUpdate = Date.now();
		function loop() {
			now = Date.now();
			delta = now - lastUpdate;

			/* Calculate FPS */
			fpsTimer += delta;
			while (fpsTimer >= 1000) {
				fpsTimer -= 1000;
				fps = '' + frames;
				frames = 0;
			}

			/* Tell game to update/render */
			game.update(delta);
			game.render(ctx, fps);

			frames += 1;
			lastUpdate = Date.now();
			setTimeout(loop, 40);
		}

		return ({
			start: function () {
				game.start();
				loop();
			}
		});
	}());

	engine.start();
}());
