/* WebGL Colour Chooser Widget
Dr Anton Gerdelan, Trinity College Dublin, Ireland.
First Version 22 Apr 2014
23 apr 2014 - fixes to gamma sampling. rgb now calculated from hsv, just because
*/

var get_pixel_flag = false;
var colour_x;
var colour_y;
var vbo;
var vbo_hue;
var vbo_chosen;
var sp;
var sp_hue;
var sp_chosen;
var chosen_fc_loc;
var box_g_loc;
var hue_g_loc;
var chosen_g_loc;
var h_loc;
var hue_deg = 0.0;
var sat_pc = 0.0;
var val_pc = 0.0;
var gamma = 1.0;

function init_colour_widget () {
	// set up triangle
	var data = [
		-1.0,  1.0,
		-1.0, -1.0,
		 1.0,  1.0,
		 1.0,  1.0,
		-1.0, -1.0,
		 1.0, -1.0,
	];
	vbo = gl.createBuffer ();
	gl.bindBuffer (gl.ARRAY_BUFFER, vbo);
	gl.bufferData (gl.ARRAY_BUFFER, new Float32Array (data), gl.STATIC_DRAW);
	
	// set up shader
	var vs_src = [
		"attribute vec2 p;\n",
		"varying vec2 vs;\n",
		"void main () {\n",
		"  vs.x = 0.5 * (p.x + 1.0);\n",
		"  vs.y = 0.5 * (p.y + 1.0);\n",
		"  gl_Position = vec4 (p.x * 0.75 - 0.25, p.y * 0.75 + 0.25, 0.0, 1.0);\n",
		"}"
	].join('\n');
	var fs_src = [
		"precision mediump float;\n",
		"uniform float h;\n",
		"uniform float g;\n",
		"varying vec2 vs;\n",
		"void main () {\n",

		"float chroma = vs.x * vs.y;\n",
		"float h_dash = h / 60.0;\n",
		"float x = chroma * (1.0 - abs (mod (h_dash, 2.0) - 1.0));\n",
		"vec3 rgb = vec3 (0.0, 0.0, 0.0);\n",
		"if (h_dash < 1.0) {\n",
		"	rgb.r = chroma;\n",
		"	rgb.g = x;\n",
		"} else if (h_dash < 2.0) {\n",
		"	rgb.r = x;\n",
		"	rgb.g = chroma;\n",
		"} else if (h_dash < 3.0) {\n",
		"	rgb.g = chroma;\n",
		"	rgb.b = x;\n",
		"} else if (h_dash < 4.0) {\n",
		"	rgb.g = x;\n",
		"	rgb.b = chroma;\n",
		"} else if (h_dash < 5.0) {\n",
		"	rgb.r = x;\n",
		"	rgb.b = chroma;\n",
		"} else {\n",
		"	rgb.r = chroma;\n",
		"	rgb.b = x;\n",
		"}\n",
		"float minv = vs.x - chroma;\n",
		"rgb += minv;\n",
		"  vec3 gamma = vec3 (g, g, g);\n",
		"  gl_FragColor = vec4 (pow (rgb, 1.0 / gamma), 1.0);\n",
		"}"
	].join('\n');
	
	var vs = gl.createShader (gl.VERTEX_SHADER);
	gl.shaderSource (vs, vs_src);
	gl.compileShader (vs);
	if (!gl.getShaderParameter (vs, gl.COMPILE_STATUS)) {
		alert ("vertex shader compile error:\n" + gl.getShaderInfoLog (vs));
		return false;
	} 
	
	var fs = gl.createShader (gl.FRAGMENT_SHADER);
	gl.shaderSource (fs, fs_src);
	gl.compileShader (fs);
	if (!gl.getShaderParameter (fs, gl.COMPILE_STATUS)) {
		alert ("frag shader compile error:\n" + gl.getShaderInfoLog (fs));
		return false;
	}
	
	sp = gl.createProgram ();
	gl.attachShader (sp, vs);
	gl.attachShader (sp, fs);
	gl.bindAttribLocation (sp, 0, "p");
	gl.linkProgram (sp);
	if (!gl.getProgramParameter (sp, gl.LINK_STATUS)) {
		alert ("linker error:\n" + gl.getProgramInfoLog (sp));
		return false;
	}
	gl.validateProgram (sp);
	if (!gl.getProgramParameter (sp, gl.VALIDATE_STATUS)) {
		alert ("validator error:\n" + gl.getProgramInfoLog (sp));
		return false;
	}
	h_loc = gl.getUniformLocation (sp, "h");
	box_g_loc = gl.getUniformLocation (sp, "g");
	gl.useProgram (sp);
	gl.uniform1f (h_loc, 0.0);
	gl.uniform1f (box_g_loc, 1.0);
	
	// set up hue chooser
	var data_hue = [
		1.0,  1.0, 1.0, 0.0, 0.0,
		-1.0,  1.0, 1.0, 0.0, 0.0,
		1.0,  0.667, 1.0, 0.0, 1.0,
		-1.0,  0.667, 1.0, 0.0, 1.0,
		1.0,  0.333, 0.0, 0.0, 1.0,
		-1.0,  0.333, 0.0, 0.0, 1.0,
		1.0,  0.0, 0.0, 1.0, 1.0,
		-1.0,  0.0, 0.0, 1.0, 1.0,
		1.0, -0.333, 0.0, 1.0, 0.0,
		-1.0, -0.333, 0.0, 1.0, 0.0,
		1.0, -0.667, 1.0, 1.0, 0.0,
		-1.0, -0.667, 1.0, 1.0, 0.0,
		1.0, -1.0, 1.0, 0.0, 0.0,
		-1.0, -1.0, 1.0, 0.0, 0.0
		
	];
	vbo_hue = gl.createBuffer ();
	gl.bindBuffer (gl.ARRAY_BUFFER, vbo_hue);
	gl.bufferData (gl.ARRAY_BUFFER, new Float32Array (data_hue), gl.STATIC_DRAW);
	
	// set up shader
	vs_src = [
		"attribute vec2 p;\n",
		"attribute vec3 c;\n",
		"varying vec3 fc;\n",
		"void main () {\n",
		"  fc = c;\n",
		"  gl_Position = vec4 (p.x * 0.125 + 0.875, p.y * 0.75 + 0.25, 0.0, 1.0);\n",
		"}"
	].join('\n');
	fs_src = [
		"precision mediump float;\n",
		"varying vec3 fc;\n",
		"uniform float g;\n",
		"void main () {\n",
		"  vec3 gamma = vec3 (g, g, g);\n",
		"  gl_FragColor = vec4 (pow (fc, 1.0 / gamma), 1.0);\n",
		"}"
	].join('\n');
	
	vs = gl.createShader (gl.VERTEX_SHADER);
	gl.shaderSource (vs, vs_src);
	gl.compileShader (vs);
	if (!gl.getShaderParameter (vs, gl.COMPILE_STATUS)) {
		alert ("vertex shader compile error:\n" + gl.getShaderInfoLog (vs));
		return false;
	} 
	
	fs = gl.createShader (gl.FRAGMENT_SHADER);
	gl.shaderSource (fs, fs_src);
	gl.compileShader (fs);
	if (!gl.getShaderParameter (fs, gl.COMPILE_STATUS)) {
		alert ("frag shader compile error:\n" + gl.getShaderInfoLog (fs));
		return false;
	}
	
	sp_hue = gl.createProgram ();
	gl.attachShader (sp_hue, vs);
	gl.attachShader (sp_hue, fs);
	gl.bindAttribLocation (sp_hue, 0, "p");
	gl.bindAttribLocation (sp_hue, 1, "c");
	gl.linkProgram (sp_hue);
	if (!gl.getProgramParameter (sp_hue, gl.LINK_STATUS)) {
		alert ("linker error:\n" + gl.getProgramInfoLog (sp_hue));
		return false;
	}
	gl.validateProgram (sp_hue);
	if (!gl.getProgramParameter (sp_hue, gl.VALIDATE_STATUS)) {
		alert ("validator error:\n" + gl.getProgramInfoLog (sp_hue));
		return false;
	}
	hue_g_loc = gl.getUniformLocation (sp_hue, "g");
	gl.useProgram (sp_hue);
	gl.uniform1f (hue_g_loc, 1.0);
	
	var data_chosen = [
		-1.0,  1.0,
		-1.0, -1.0,
		 1.0,  1.0,
		 1.0,  1.0,
		-1.0, -1.0,
		 1.0, -1.0
	];
	
	// chosen square
	vbo_chosen = gl.createBuffer ();
	gl.bindBuffer (gl.ARRAY_BUFFER, vbo_chosen);
	gl.bufferData (
		gl.ARRAY_BUFFER, new Float32Array (data_chosen), gl.STATIC_DRAW);
		
	// set up shader
	vs_src = [
		"attribute vec2 p;\n",
		"void main () {\n",
		"  gl_Position = vec4 (p.x, p.y * 0.2 - 0.75, 0.0, 1.0);\n",
		"}"
	].join('\n');
	fs_src = [
		"precision mediump float;\n",
		"uniform vec3 fc;\n",
		"uniform float g;\n",
		"void main () {\n",
		"  vec3 gamma = vec3 (g, g, g);\n",
		"  gl_FragColor = vec4 (pow (fc, 1.0 / gamma), 1.0);\n",
		"}"
	].join('\n');
	
	vs = gl.createShader (gl.VERTEX_SHADER);
	gl.shaderSource (vs, vs_src);
	gl.compileShader (vs);
	if (!gl.getShaderParameter (vs, gl.COMPILE_STATUS)) {
		alert ("vertex shader compile error:\n" + gl.getShaderInfoLog (vs));
		return false;
	} 
	
	fs = gl.createShader (gl.FRAGMENT_SHADER);
	gl.shaderSource (fs, fs_src);
	gl.compileShader (fs);
	if (!gl.getShaderParameter (fs, gl.COMPILE_STATUS)) {
		alert ("frag shader compile error:\n" + gl.getShaderInfoLog (fs));
		return false;
	}
	
	sp_chosen = gl.createProgram ();
	gl.attachShader (sp_chosen, vs);
	gl.attachShader (sp_chosen, fs);
	gl.bindAttribLocation (sp_chosen, 0, "p");
	gl.linkProgram (sp_chosen);
	if (!gl.getProgramParameter (sp_chosen, gl.LINK_STATUS)) {
		alert ("linker error:\n" + gl.getProgramInfoLog (sp_chosen));
		return false;
	}
	gl.validateProgram (sp_chosen);
	if (!gl.getProgramParameter (sp_chosen, gl.VALIDATE_STATUS)) {
		alert ("validator error:\n" + gl.getProgramInfoLog (sp_chosen));
		return false;
	}
	chosen_fc_loc = gl.getUniformLocation (sp_chosen, "fc");
	chosen_g_loc = gl.getUniformLocation (sp_chosen, "g");
	gl.useProgram (sp_chosen);
	gl.uniform3f (chosen_fc_loc, 0.0, 0.0, 0.0);
	gl.uniform1f (chosen_g_loc, 1.0);
	
	canvas.onmousedown = function (ev) {
		get_pixel_flag = true;
		// recursively get location within parent(s)
		var element = canvas;
		var top = 0;
		var left = 0;
		while (element && element.tagName != 'BODY') {
			top += element.offsetTop;
			left += element.offsetLeft;
			element = element.offsetParent;
		}
		// adjust for scrolling
		left += window.pageXOffset;
		top -= window.pageYOffset;
		colour_x = ev.clientX - left;
		colour_y = (ev.clientY - top);
		// sometimes range is a few pixels too big
		if (colour_x >= canvas.width) {
			return;
		}
		if (colour_y >= canvas.height) {
			return;
		}
		main_loop ();
	}
	document.onmouseup = function (ev) {
		get_pixel_flag = false;
		main_loop ();
	}
	canvas.onmousemove = function (ev) {
		if (!get_pixel_flag) {
			return;
		}
		// recursively get location within parent(s)
		var element = canvas;
		var top = 0;
		var left = 0;
		while (element && element.tagName != 'BODY') {
			top += element.offsetTop;
			left += element.offsetLeft;
			element = element.offsetParent;
		}
		// adjust for scrolling
		left += window.pageXOffset;
		top -= window.pageYOffset;
		colour_x = ev.clientX - left;
		colour_y = (ev.clientY - top);
		// sometimes range is a few pixels too big
		if (colour_x >= canvas.width) {
			return;
		}
		if (colour_y >= canvas.height) {
			return;
		}
		main_loop ();
	}
	var gbox = document.getElementById ("gammabox");
	gbox.onkeyup = function () {
		gamma = parseFloat (gbox.value);
		console.log ("gamma changed to " + gamma);
		gl.useProgram (sp);
		gl.uniform1f (box_g_loc, gamma);
		gl.useProgram (sp_hue);
		gl.uniform1f (hue_g_loc, gamma);
		gl.useProgram (sp_chosen);
		gl.uniform1f (chosen_g_loc, gamma);
		main_loop ();
	}
}

function draw_colour_widget () {
	gl.enable (gl.CULL_FACE); // enable culling of faces
	gl.cullFace (gl.BACK);
	gl.frontFace (gl.CCW);

	gl.useProgram (sp);
	gl.bindBuffer (gl.ARRAY_BUFFER, vbo);
	gl.vertexAttribPointer (0, 2, gl.FLOAT, false, 8, 0);
	gl.enableVertexAttribArray (0);
	gl.drawArrays (gl.TRIANGLES, 0, 6);
	gl.disableVertexAttribArray (0);
	
	gl.useProgram (sp_hue);
	gl.bindBuffer (gl.ARRAY_BUFFER, vbo_hue);
	gl.vertexAttribPointer (0, 2, gl.FLOAT, false, 20, 0);
	gl.vertexAttribPointer (1, 3, gl.FLOAT, false, 20, 8);
	gl.enableVertexAttribArray (0);
	gl.enableVertexAttribArray (1);
	gl.drawArrays (gl.TRIANGLE_STRIP, 0, 14);
	gl.disableVertexAttribArray (0);
	gl.disableVertexAttribArray (1);
	
	gl.useProgram (sp_chosen);
	gl.bindBuffer (gl.ARRAY_BUFFER, vbo_chosen);
	gl.vertexAttribPointer (0, 2, gl.FLOAT, false, 8, 0);
	gl.enableVertexAttribArray (0);
	gl.drawArrays (gl.TRIANGLES, 0, 6);
	gl.disableVertexAttribArray (0);
}

function dec_to_hex (d) {
	var hex = Number (d).toString(16).toUpperCase();
	// add padding
	while (hex.length < 2) {
		hex = "0" + hex;
	}
	return hex;
}

function get_widget_colours () {
	//console.log (colour_x + "," + colour_y);
	//console.log (pixel[0] + "," + pixel[1] + "," + pixel[2] + "," + pixel[3]);
	
	// hue picker
	if (colour_x > 0.875 * canvas.width && colour_y < 0.75 * canvas.height) {
		var pixel = new Uint8Array (1 * 1 * 4); // 4 channels 1x1 size
		gl.readPixels (
			colour_x,
			canvas.height - colour_y,
			1,
			1,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			pixel
		);
		var hue_r = Math.pow (pixel[0] / 255.0, gamma);
		var hue_g = Math.pow (pixel[1] / 255.0, gamma);
		var hue_b = Math.pow (pixel[2] / 255.0, gamma);
		hue_deg = Math.floor (360 - (colour_y / (0.75 * canvas.height)) * 361);
		// hack to make to work all the way to pure red at the top without falling off
		if (hue_deg == 360) {
			hue_r = 1.0;
			hue_g = 0.0;
			hue_b = 0.0;
		}
		// hue colour affects main chooser box
		gl.useProgram (sp);
		gl.uniform1f (h_loc, hue_deg);
	}
	
	// main SV box
	if (colour_x < 0.75 * canvas.width && colour_y < 0.75 * canvas.height) {
		sat_pc = Math.floor (100 - colour_y / (canvas.height * 0.75) * 101);
		val_pc = Math.floor (colour_x / (canvas.width * 0.75) * 101);
	}
	
	var chroma = (val_pc * 0.01) * (sat_pc * 0.01);
	var hue_dash = hue_deg / 60.0;
	var x = chroma * (1.0 - Math.abs (hue_dash % 2.0 - 1.0));
	var r = 0.0;
	var g = 0.0;
	var b = 0.0;
	//console.log (hue_dash, chroma, x);
	if (hue_dash < 1.0) {
		r = chroma;
		g = x;
	} else if (hue_dash < 2.0) {
		r = x;
		g = chroma;
	} else if (hue_dash < 3.0) {
		g = chroma;
		b = x;
	} else if (hue_dash < 4.0) {
		g = x;
		b = chroma;
	} else if (hue_dash < 5.0) {
		r = x;
		b = chroma;
	} else {
		r = chroma;
		b = x;
	}
	var minv = (val_pc * 0.01) - chroma;
	//console.log ((val_pc * 0.01) + " - " + chroma + " = " + minv);
	r += minv;
	g += minv;
	b += minv;
	//console.log (r + ", " + g + ", " + b);
	
	gl.useProgram (sp_chosen);
	gl.uniform3f (chosen_fc_loc, r, g, b);
	
	document.getElementById ("pcolc").innerHTML =
		hue_deg + ", " + sat_pc + ", " + val_pc;
	document.getElementById ("pcola").innerHTML =
		Math.floor (r * 255.0) + ", " +
		Math.floor (g * 255.0) + ", " +
		Math.floor (b * 255.0);
	document.getElementById ("phex").innerHTML = "#" +
		dec_to_hex (Math.floor (r * 255.0)) +
		dec_to_hex (Math.floor (g * 255.0)) +
		dec_to_hex (Math.floor (b * 255.0));
	document.getElementById ("pcolb").innerHTML =
		r.toPrecision(3) + ", " + g.toPrecision(3) + ", " + b.toPrecision(3);
}
