function main(){
    var canvas = document.getElementById("canvas");
    var gl = canvas.getContext("webgl");
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    
    var up=vec3(0,1,0);
    var eye=vec3(0,0,3);
    var at=vec3(0,0,0);

    aspect=canvas.width/canvas.height;
    var V =lookAt(eye, at, up);
    var P = perspective(45, aspect, 0.1, 10);
    //var P=ortho(-2, 2, -2, 2, 2, -2);

    var point_1_M=translate(-0.5,-0.5,0)
    var point_1_M=mult(scalem(0.5,0.5,0.5),point_1_M);
    var point_1_M=mult(rotate(7,vec4(0,1,0,1)),point_1_M);
    var point_1_M=mult(rotate(7,vec4(1,0,0,1)),point_1_M);
    
    var point_2_M=translate(1,0.9,0)
    var point_2_M=mult(scalem(0.5,0.5,0.5),point_2_M);   
    var point_2_M=mult(rotate(-13,vec4(0,1,0,1)),point_2_M);

    var point_3_M=translate(-2,1,0)
    var point_3_M=mult(scalem(0.5,0.5,0.5),point_3_M);   
    var point_3_M=mult(rotate(0,vec4(0,1,0,1)),point_3_M);


    var model_view_matrix=mult(P,V)

    var Mloc=gl.getUniformLocation(program, "u_model_view_matrix");
    gl.uniformMatrix4fv(Mloc, false, flatten(model_view_matrix)); 


    var base_vertices = [
        vec4(0,0,1,1),
        vec4(0,1,1,1),
        vec4(1,1,1,1),
        vec4(1,0,1,1),

        vec4(0,0,0,1),
        vec4(0,1,0,1),
        vec4(1,1,0,1),
        vec4(1,0,0,1)
    ];
    vertices=[]
    for(i=0;i<base_vertices.length;i++){
        var m=mult(model_view_matrix,point_1_M)
        vertices.push(mult(m,base_vertices[i]))
    }
    for(i=0;i<base_vertices.length;i++){
        var m=mult(model_view_matrix,point_2_M)
        vertices.push(mult(m,base_vertices[i]))
    }
    for(i=0;i<base_vertices.length;i++){
        var m=mult(model_view_matrix,point_3_M)
        vertices.push(mult(m,base_vertices[i]))
    }

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
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



        8,9,
        9,10,
        10,11,
        11,8,

        12,13,
        13,14,
        14,15,
        15,12,

        8,12,
        11,15,
        10,14,
        9,13,




        16,17,
        17,18,
        18,19,
        19,16,

        20,21,
        21,22,
        22,23,
        23,20,

        16,20,
        19,23,
        18,22,
        17,21,
    ]

    var iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices),
    gl.STATIC_DRAW);
    gl.drawElements(gl.LINES, indices.length, gl.UNSIGNED_BYTE, 0);
}

window.onload = main;