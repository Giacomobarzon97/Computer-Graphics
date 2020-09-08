var angle=0
function main(){
    var canvas = document.getElementById("canvas");
    var gl = canvas.getContext("webgl");
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var vertices = [ vec2(-0.5, 0.5), vec2(0.5, 0.5), vec2(-0.5, -0.5), vec2(0.5,0.5),vec2(0.5,-0.5),vec2(-0.5,-0.5)];
    for(i=0;i<vertices.length;i++){
        x1=vertices[i][0]*Math.cos(angle)-vertices[i][1]*Math.sin(angle);
        y1=vertices[i][0]*Math.sin(angle)+vertices[i][1]*Math.cos(angle);
        vertices[i]=vec2(x1,y1);
    }

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    angle=angle+0.01;
    window.requestAnimationFrame(main);
}

window.onload = main;