function main(){
    var max_verts = 1000;
    var index = 0; 
    var num_points = 0;

    var canvas = document.getElementById("canvas");
    var gl = canvas.getContext("webgl");

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, max_verts*sizeof['vec2'], gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var color_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, max_verts*sizeof['vec4'], gl.STATIC_DRAW);
    var vColor = gl.getAttribLocation(program, "a_Color");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);
    
    canvas.addEventListener("click", function (ev) {
        var bbox = ev.target.getBoundingClientRect();
        mousepos = vec2(2*(ev.clientX - bbox.left)/canvas.width - 1, 2*(canvas.height - ev.clientY + bbox.top - 1)/canvas.height - 1);
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec2'], flatten(mousepos));
        gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec4'], flatten(get_point_color()));
        num_points = Math.max(num_points, ++index); 
        index %= max_verts;        
        render(gl, num_points)
    });

    clear_button=document.getElementById("clear_button");
    clear_button.addEventListener("click", function(ev){
        index=0;
        num_points=0;
        render(gl,num_points);
    });

    render(gl, num_points);
}

function render(gl, num_points){
    background_color=get_background_color();
    gl.clearColor(background_color[0],background_color[1],background_color[2],background_color[3]);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, num_points);
}

function get_background_color(){
    var background_red=document.getElementById("background_red");
    var background_green=document.getElementById("background_green");
    var background_blue=document.getElementById("background_blue");

    return vec4(background_red.value, background_green.value, background_blue.value, )
}

function get_point_color(){
    var background_red=document.getElementById("point_red");
    var background_green=document.getElementById("point_green");
    var background_blue=document.getElementById("point_blue");

    return vec4(background_red.value, background_green.value, background_blue.value, )
}

window.onload = main;