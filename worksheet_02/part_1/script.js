function main(){
    var max_verts = 1000;
    var index = 0; 
    var num_points = 0;

    var canvas = document.getElementById("canvas");
    var gl = canvas.getContext("webgl");
    
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, max_verts*sizeof['vec2'], gl.STATIC_DRAW);

    gl.bufferSubData(gl.ARRAY_BUFFER, 1*sizeof['vec2'], flatten(vec2(0,0)));
    gl.bufferSubData(gl.ARRAY_BUFFER, 2*sizeof['vec2'], flatten(vec2(0,1)));
    gl.bufferSubData(gl.ARRAY_BUFFER, 3*sizeof['vec2'], flatten(vec2(1,0)));
    num_points=4;
    index=4;

    var vPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    canvas.addEventListener("click", function (ev) {
        var bbox = ev.target.getBoundingClientRect();
        mousepos = vec2(2*(ev.clientX - bbox.left)/canvas.width - 1, 2*(canvas.height - ev.clientY + bbox.top - 1)/canvas.height - 1);
        gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec2'], flatten(mousepos));
        num_points = Math.max(num_points, ++index); 
        index %= max_verts;        
        render(gl, num_points)
    });

    render(gl, num_points);
}

function render(gl, num_points){
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, num_points);
}

window.onload = main;
