(function () {
	var game, engine;

	/* Actual game */
	game = (function () {
		var width, height;
		width = 400;
		height =  400;

		function update(ms) {
		}

		function render(ctx) {
			ctx.fillStyle = '#f00';
			ctx.fillRect(0, 0, 10, 10);
		}

		return ({
			width: width,
			height: height,
			update: update,
			render: render,
			mousedown: function (x, y) {
				console.log(x, y);
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
				loop();
			}
		});
	}());

	engine.start();
}());
