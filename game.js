(function () {
	var ctx, width, height;
	width = 400;
	height =  400;

	ctx = (function () {
		var canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		document.body.appendChild(canvas);
		
		return canvas.getContext('2d');
	}());

	window.ctx = ctx;
}());
