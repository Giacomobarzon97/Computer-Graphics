function main(){
    angle=0
    var canvas = document.getElementById("canvas");
    var gl = WebGLUtils.setupWebGL(canvas, { alpha: false });

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.program=program;
    gl.useProgram(program);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    var up=vec3(0,1,0);
    var eye=vec3(0,0,0);
    var at=vec3(0,-1,-1);

    aspect=canvas.width/canvas.height;
    var V =lookAt(eye, at, up);
    var P = perspective(90, aspect, 0.1, 21);
    var M =translate(0,1,0);
    
    var model_view_matrix=mult(P,V)

    var Mloc=gl.getUniformLocation(program, "u_model_view_matrix");

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
    var vPosition = gl.getAttribLocation(program, "a_Position");
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    loadTexture(gl,"xamp23.png")

    var quad_tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, quad_tex);
    gl.uniform1i(gl.getUniformLocation(program, "u_quad_tex"), 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,  new Uint8Array([255, 0, 0,255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    var tex_coord=[
        vec3(0,0,0),
        vec3(1,0,0),
        vec3(1,1,0),
        vec3(1,1,0),
        vec3(0,1,0),
        vec3(0,0,0),

        vec3(0,0,1),
        vec3(0,0,1),
        vec3(0,0,1),
        vec3(0,0,1),
        vec3(0,0,1),
        vec3(0,0,1),
       
        vec3(0,0,1),
        vec3(0,0,1),
        vec3(0,0,1),
        vec3(0,0,1),
        vec3(0,0,1),
        vec3(0,0,1),
    ]

    var tBuffer = gl.createBuffer();
    var tPosition = gl.getAttribLocation(program, "a_Texcoord");
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(tex_coord), gl.STATIC_DRAW);
    gl.vertexAttribPointer(tPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(tPosition);

    function new_frame(){
        //gl.uniformMatrix4fv(Mloc, false, flatten(model_view_matrix));
        //gl.uniform1f(gl.getUniformLocation(program, "u_visibilty"), 1.0);

        light_pos=vec3(2*Math.sin(angle),2,(2*Math.cos(angle))-2)
        angle=angle+0.05;

        gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);


        render(gl,0,6);

        d=-(light_pos[1]+1+1e-4);
        projection_matrix=mat4(vec4(1,0,0,0),vec4(0,1,0,0),vec4(0,0,1,0),vec4(0,1/d,0,0))

        t_matrix_1=mat4(vec4(1,0,0,light_pos[0]),vec4(0,1,0,light_pos[1]),vec4(0,0,1,light_pos[2]),vec4(0,0,0,1))
        t_matrix_2=mat4(vec4(1,0,0,-light_pos[0]),vec4(0,1,0,-light_pos[1]),vec4(0,0,1,-light_pos[2]),vec4(0,0,0,1))
        //projection_matrix_s=mult(P,mult(V,mult(t_matrix_1,mult(projection_matrix,mult(t_matrix_2,mat4())))))
        projection_matrix_s=mult(model_view_matrix,mult(t_matrix_1,mult(projection_matrix,t_matrix_2)))
        gl.uniformMatrix4fv(Mloc, false, flatten(projection_matrix_s));
        gl.uniform1f(gl.getUniformLocation(program, "u_visibility"), 0);
        gl.uniform1f(gl.getUniformLocation(program, "u_alpha"), 0.5);

        gl.depthFunc(gl.GREATER)
        render(gl,6,12);

        gl.depthFunc(gl.LESS)
        gl.uniformMatrix4fv(Mloc, false, flatten(model_view_matrix));
        gl.uniform1f(gl.getUniformLocation(program, "u_visibility"), 1.0);
        gl.uniform1f(gl.getUniformLocation(program, "u_alpha"), 1);

        render(gl,6,12);

        window.requestAnimationFrame(new_frame);
    }
    new_frame();
}

function render(gl,offset,n){
    gl.drawArrays(gl.TRIANGLES, offset, n);
}

function loadTexture(gl,url) {
    var tex = gl.createTexture();
    var img = new Image();

    img.addEventListener('load', function() {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.uniform1i(gl.getUniformLocation(gl.program, "u_ground_tex"), 0);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    });
    img.src = url;
}

window.onload = main;