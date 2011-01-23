(function (window) {
	var game, engine, document = window.document;

	game = (function () {
		var width, height, board, tiles, selected;
		width = 400;
		height =  450;

		function rand(min, max) {
			return min + Math.floor(Math.random() * (max - min));
		}

		function createArray(size, defaultValue) {
			var j, result = [];
			for (j = 0; j < size; j += 1) {
				result.push(defaultValue || 0);
			}
			
			return result;
		}

		function createBoard(columns, rows, size) {
			var board = createArray(columns).map(function (column, x) {
				return createArray(rows).map(function (row, y) {
					var tile = {
						x: x * size,
						y: y * size,
						type: rand(1, tiles.length),
						size: size
					};

					/* Setup new "target" positions (for animation) */
					tile.tx = tile.x; // target x
					tile.ty = tile.y; // target y

					return tile;
				});
			});

			board.columns = columns;
			board.rows = rows;
			board.tileSize = size;

			window.board = board;
			return board;
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

		/* Convert x, y mouse coordinates to tile index */
		function pickTile(mx, my) {
			var x, y;
			x = Math.floor(mx / board.tileSize);
			y = Math.floor(my / board.tileSize);

			if (x < 0 || x >= board.columns || y < 0 || y >= board.rows) {
				return -1;
			}

			return { x: x, y: y };
		}

		function getAdjacentTiles(coords) {
			var x, y, type, matches = [];
			x = coords.x;
			y = coords.y;
			type = board[x][y].type;

			if (type === 0) {
				return [];
			}

			(function traverse(x, y) {
				if (x < 0 || x >= board.columns || y < 0 || y >= board.rows) {
					return;
				}

				var tile = y * board.columns + x;

				if (typeof matches[tile] !== 'undefined' || board[x][y].type !== type) {
					return;
				}

				matches[tile] = {x: x, y: y};

				/* Check adjacent tiles */
				traverse(x - 1, y);
				traverse(x + 1, y);
				traverse(x, y - 1);
				traverse(x, y + 1);
			}(x, y));

			/* Filter out the 'undefined' space-fillers in the array */
			return matches.filter(function (x) {
				return x;
			});
		}

		/* Determine selected tiles based on mouse position */
		function getSelectedTiles(x, y) {
			var tile = pickTile(x, y);
			if (tile === -1) {
				return [];
			}

			return getAdjacentTiles(tile);
		}

		/* Place tiles in correct positions after a deletion */
		function fixBoard() {
			board.forEach(function (column, key) {
				/* Remove deleted tiles from column */
				var result = column.filter(function (tile) {
					return tile.type !== 0;
				});

				/* Add blank tiles to top to keep array length consistent */
				while (result.length < column.length) {
					result.unshift({ x: 0, y: 0, tx: 0, ty: 0, size: 0, type: 0 });
				}

				/* Update vertical position of remaining tiles */
				board[key] = result.map(function (tile, index) {
					tile.ty = index * tile.size;
					return tile;
				});
			});
		}

		function mousedown(x, y) {
			selected = getSelectedTiles(x, y);

			if (selected.length > 1) {
				/* Delete selected tiles */
				selected.forEach(function (index) {
					board[index.x][index.y].type = 0;
				});

				fixBoard();
			}

			return false;
		}

		function mousemove(x, y) {
			selected = getSelectedTiles(x, y);
			return false;
		}

		function reset() {
			board = createBoard(10, 10, 40);
		}

		function start() {
			tiles = createTiles(40, ['#fff', '#f00', '#0c0', '#00f', '#dd0', '#0af', '#c0f']);
			selected = []; // selected tiles
			reset();
		}

		function update(ms) {
			board.forEach(function (column) {
				column.forEach(function (tile) {
					tile.y = tile.ty;
				});
			});
		}

		function render(ctx, fps) {
			ctx.fillStyle = '#fff';
			ctx.fillRect(0, 0, width, height);

			/* Draw tiles */
			board.forEach(function (column) {
				column.forEach(function (tile) {
					if (tile.type !== 0) {
						ctx.putImageData(tiles[tile.type], tile.x, tile.y);
					}
				});
			});

			/* Highlight selected tiles */
			ctx.fillStyle = 'rgba(255, 255, 255, .5)';
			selected.forEach(function (index) {
				var tile = board[index.x][index.y];
				ctx.fillRect(tile.x, tile.y, tile.size, tile.size);
			});

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
			start: start,
			mousedown: mousedown,
			mousemove: mousemove,
			mouseout: function () {
				selected = [];
			}
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
			['mousedown', 'mousemove', 'mouseout'].forEach(function (event) {
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
			window.setTimeout(loop, 40);
		}

		return ({
			start: function () {
				game.start();
				loop();
			}
		});
	}());

	engine.start();
}(this));
