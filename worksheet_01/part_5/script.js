var n_vertices=100;
var radius=0.5;
var var_center=vec2(0,-0.5);
var bounce_direction=1;
function main(){
    var canvas = document.getElementById("canvas");
    var gl = canvas.getContext("webgl");
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var vertices = [var_center];
    
    for(i=0;i<=n_vertices;i++){
        var angle=(2*i*Math.PI)/n_vertices;
        var new_vertex=vec2(radius*Math.cos(angle)+var_center[0],radius*Math.sin(angle)+var_center[1]);
        vertices.push(new_vertex)
    }

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length);
    var_center=vec2(0,var_center[1]+0.01*bounce_direction)
    if(var_center[1]>0.5){
        bounce_direction=-1;
    }
    if(var_center[1]<-0.5){
        bounce_direction=1;
    }
    window.requestAnimationFrame(main);
}

window.onload = main;