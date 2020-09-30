function main(){
    var canvas = document.getElementById("canvas");
    var gl = canvas.getContext("webgl");
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    
    var up=vec3(0,1,0);
    var eye=vec3(3,3,3);
    var at=vec3(0,0,0);

    aspect=canvas.width/canvas.height;
    var V =lookAt(eye, at, up);
    var P = perspective(45, aspect, 0.1, 10);
    var M =translate(0,1,0);
    
    var model_view_matrix=mult(P,V)

    var Mloc=gl.getUniformLocation(program, "u_model_view_matrix");
    gl.uniformMatrix4fv(Mloc, false, flatten(model_view_matrix)); 



    var vertices = [
        vec3(0,0,1),
        vec3(0,1,1),
        vec3(1,1,1),
        vec3(1,0,1),

        vec3(0,0,0),
        vec3(0,1,0),
        vec3(1,1,0),
        vec3(1,0,0)
    ];
    
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    var indices=[
        0,1,
        1,2,
        2,3,
        3,0,

        4,5,
        5,6,
        6,7,
        7,4,

        0,4,
        3,7,
        2,6,
        1,5,
    ]

    /*
    var indices = [
        1, 0, 3,
        3, 2, 1,
        2, 3, 7,
        7, 6, 2,
        3, 0, 4,
        4, 7, 3,
        6, 5, 1,
        1, 2, 6,
        4, 5, 6,
        6, 7, 4,
        5, 4, 0,
        0, 1, 5
    ];
    */
    var iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices),
    gl.STATIC_DRAW);
    gl.drawElements(gl.LINES, indices.length, gl.UNSIGNED_BYTE, 0);
}

window.onload = main;