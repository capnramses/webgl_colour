/* WebGL Colour Chooser Widget
Dr Anton Gerdelan, Trinity College Dublin, Ireland.
First Version 22 Apr 2014 */

var canvas;
var gl;
init ();

function init () {
	canvas = document.getElementById ("canvas");
	gl = WebGLUtils.setupWebGL (canvas);
	gl.clearColor (0.2, 0.2, 0.2, 0.0);
	
	init_colour_widget ();

	// go!
	gl.viewport (0, 0, canvas.width, canvas.height);
	gl.clear (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	main_loop ();
}

function main_loop () {
	gl.clear (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	draw_colour_widget ();
	if (get_pixel_flag) {
		get_widget_colours ();
	}
	//window.requestAnimFrame (main_loop);
}
