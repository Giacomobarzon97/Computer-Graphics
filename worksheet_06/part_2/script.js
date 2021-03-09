function main(){
    var canvas = document.getElementById("canvas");
    var gl = canvas.getContext("webgl");

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    
    var up=vec3(0,1,0);
    var eye=vec3(0,1,1);
    var at=vec3(0,-1,-1);

    aspect=canvas.width/canvas.height;
    var V =lookAt(eye, at, up);
    var P = perspective(90, aspect, 0.1, 21);
    var M =translate(0,1,0);
    
    var model_view_matrix=mult(P,V)

    var Mloc=gl.getUniformLocation(program, "u_model_view_matrix");
    gl.uniformMatrix4fv(Mloc, false, flatten(model_view_matrix)); 

    var vertices = [
        vec3(-4,-1,-1),
        vec3(4,-1,-1),
        vec3(4,-1,-21),

        vec3(4,-1,-21),
        vec3(-4,-1,-21),
        vec3(-4,-1,-1),
    ];
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var tex_coord=[
        vec2(-1.5,0),
        vec2(2.5,0),
        vec2(2.5,10),

        vec2(2.5,10),
        vec2(-1.5,10),
        vec2(-1.5,0)
    ]
    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(tex_coord), gl.STATIC_DRAW);
    var tPosition = gl.getAttribLocation(program, "a_Texcoord");
    gl.vertexAttribPointer(tPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(tPosition);

    var texture = gl.createTexture();
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
    gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, myTexels);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.generateMipmap(gl.TEXTURE_2D);

    render(gl, vertices.length)

    repeat_button=document.getElementById("b_repeat");
    repeat_button.addEventListener("click", function(ev){
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        render(gl, vertices.length)
    });

    clamp_button=document.getElementById("b_clamp");
    clamp_button.addEventListener("click", function(ev){
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        render(gl, vertices.length)
    });

    nearest_button=document.getElementById("b_nearest");
    nearest_button.addEventListener("click", function(ev){
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);        
        render(gl, vertices.length)
    });

    linear_button=document.getElementById("b_linear");
    linear_button.addEventListener("click", function(ev){
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);        
        render(gl, vertices.length)
    });

    mipmap_button=document.getElementById("b_mipmap_n_n");
    mipmap_button.addEventListener("click", function(ev){
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST_MIPMAP_NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);        
        render(gl, vertices.length)
    });

    mipmap_button=document.getElementById("b_mipmap_l_n");
    mipmap_button.addEventListener("click", function(ev){
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);        
        render(gl, vertices.length)
    });

    mipmap_button=document.getElementById("b_mipmap_n_l");
    mipmap_button.addEventListener("click", function(ev){
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);        
        render(gl, vertices.length)
    });

    mipmap_button=document.getElementById("b_mipmap_l_l");
    mipmap_button.addEventListener("click", function(ev){
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);        
        render(gl, vertices.length)
    });
}
function render(gl,n){
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, n);
}
window.onload = main;