function main(){
    var canvas = document.getElementById("canvas");
    var gl = canvas.getContext("webgl");

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.program=program;

    gl.useProgram(program);
    
    var up=vec3(0,1,0);
    var eye=vec3(0,0,0);
    var at=vec3(0,-1,-1);

    aspect=canvas.width/canvas.height;
    var V =lookAt(eye, at, up);
    var P = perspective(90, aspect, 0.1, 21);
    var M =translate(0,1,0);
    
    var model_view_matrix=mult(P,V)

    var Mloc=gl.getUniformLocation(program, "u_model_view_matrix");
    gl.uniformMatrix4fv(Mloc, false, flatten(model_view_matrix)); 

    var vertices = [
        vec3(-2,-1,-1),
        vec3(2,-1,-1),
        vec3(2,-1,-5),

        vec3(2,-1,-5),
        vec3(-2,-1,-5),
        vec3(-2,-1,-1),

        vec3(0.25,-0.5,-1.25),
        vec3(0.75,-0.5,-1.25),
        vec3(0.75,-0.5,-1.75),

        vec3(0.75,-0.5,-1.75),
        vec3(0.25,-0.5,-1.75),
        vec3(0.25,-0.5,-1.25),
        
        vec3(-1,-1,-2.5),
        vec3(-1,-0,-2.5),
        vec3(-1,-1,-3),

        vec3(-1,0,-3),
        vec3(-1,-1,-3),
        vec3(-1,0,-2.5),
    ];
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    ///*
    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    texSize=64;
    numRows=numCols=8;
    var myTexels = new Uint8Array(4*texSize*texSize);
    for(var i = 0; i < texSize; ++i){
        for(var j = 0; j < texSize; ++j){
            var patchx = Math.floor(i/(texSize/numRows));
            var patchy = Math.floor(j/(texSize/numCols));
            var c = (patchx%2 !== patchy%2 ? 255 : 0);
            var idx = 4*(i*texSize + j);
            myTexels[idx] = myTexels[idx + 1] = myTexels[idx + 2] = c;
            myTexels[idx + 3] = 255;
        }
    }
    gl.uniform1i(gl.getUniformLocation(program, "u_texMap"), 1);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, myTexels);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    //*/

    //loadTexture(gl,"xamp23.png")
    var tex_coord=[
        vec2(0,0),
        vec2(1,0),
        vec2(1,1),

        vec2(1,1),
        vec2(0,1),
        vec2(0,0)
    ]
    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(tex_coord), gl.STATIC_DRAW);
    var tPosition = gl.getAttribLocation(program, "a_Texcoord");
    gl.vertexAttribPointer(tPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(tPosition);

    render(gl, vertices.length)
}
function render(gl,n){
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, n);
}

function loadTexture(gl,url) {
    var tex = gl.createTexture();
    var img = new Image();

    img.addEventListener('load', function() {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        
        gl.uniform1i(gl.getUniformLocation(gl.program, "u_texMap"), 1);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    });
    img.src = url;
}

window.onload = main;