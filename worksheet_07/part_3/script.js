function main(){
    n_subdivisions=1;

    var canvas = document.getElementById("canvas");
    var gl = canvas.getContext("webgl");
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    gl.enable(gl.CULL_FACE)
    gl.enable(gl.DEPTH_TEST);
    gl.frontFace(gl.CW);
    
    var radious=3;
    var alpha=1;
    var up=vec3(0,1,0);
    var at=vec3(0,0,0);
    aspect=canvas.width/canvas.height;

    g_tex_ready=0;
    gl.program=program;
    initTexture(gl);

    light=vec4(0,0,-1,0);
    var Posloc=gl.getUniformLocation(program, "u_lightPos");
    gl.uniform4f(Posloc,light[0],light[1],light[2],light[3]);
    Le=vec3(1,1,1);
    var Leloc=gl.getUniformLocation(program, "u_Le");
    gl.uniform3f(Leloc,Le[0],Le[1],Le[2]);

    function rotate_camera(){
        if(g_tex_ready>=6){
            gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
            
            var M_view_loc=gl.getUniformLocation(program, "u_model_view_matrix");
            var M_tex_loc=gl.getUniformLocation(program, "u_m_tex");
            var eye_loc=gl.getUniformLocation(program, "u_eye");
            var reflective_loc=gl.getUniformLocation(program, "u_reflective");


            var eye=get_eye(radious,alpha);
            var V =lookAt(eye, at, up);
            var P = perspective(90, aspect, 0.1, 10);
            gl.uniform3f(eye_loc,eye[0],eye[1],eye[2]);

            var model_view_matrix=mult(P,V)
            gl.uniformMatrix4fv(M_view_loc, false, flatten(model_view_matrix));
            gl.uniformMatrix4fv(M_tex_loc, false, flatten(mat4()));
            gl.uniform1i(reflective_loc,1);
            render(gl, gl.sphere_buffer,gl.sphere_n_vertices)
            
            var V_inv=inverse(V);
            var m=mat4(vec4(V_inv[0][0],V_inv[0][1],V_inv[0][2],0),vec4(V_inv[1][0],V_inv[1][1],V_inv[1][2],0),vec4(V_inv[2][0],V_inv[2][1],V_inv[2][2],0),vec4(0,0,0,0))
            var m_tex=mult(m,inverse(P));
            gl.uniformMatrix4fv(M_view_loc, false, flatten(mat4()));
            gl.uniformMatrix4fv(M_tex_loc, false, flatten(m_tex));
            gl.uniform1i(reflective_loc,0);
            render(gl, gl.quad_buffer,gl.quad_n_vertices)

            alpha=alpha+0.01;
        }
        requestAnimationFrame(rotate_camera)
    }

    initQuad(gl,program);
    vertices=initSphere(gl, program, n_subdivisions);
    rotate_camera();

    var inc_button = document.getElementById("inc_button");
    inc_button.addEventListener("click", function (ev) {
        n_subdivisions+=1;
        initSphere(gl, program, n_subdivisions)
    });

    var inc_button = document.getElementById("dec_button");
    inc_button.addEventListener("click", function (ev) {
        if (n_subdivisions>1){
            n_subdivisions-=1;
            initSphere(gl, program, n_subdivisions)
        }
    });

}
function render(gl, buffer,n_vertices){
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    var vPosition = gl.getAttribLocation(gl.program, "a_Position");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    gl.drawArrays(gl.TRIANGLES, 0, n_vertices);
}
function get_eye(r,alpha){
    return vec3(r*Math.sin(alpha),0,r*Math.cos(alpha));
}

function initQuad(gl, program){
    vertices=[
        vec4(-1, -1, 0.999,1),vec4(-1, 1, 0.999,1),vec4(1, 1, 0.999,1),
        vec4(1, 1, 0.999,1),vec4(1, -1, 0.999,1),vec4(-1, -1, 0.999,1),
    ]
    vertex_color=[
        vec3(1,1,1),vec3(1,1,1),vec3(1,1,1),
        vec3(1,1,1),vec3(1,1,1),vec3(1,1,1)
    ]

    gl.quad_n_vertices=vertices.length;

    gl.deleteBuffer(gl.quad_buffer);
    gl.quad_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.quad_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    /*
    gl.deleteBuffer(gl.sphere_color_buffer);
    gl.sphere_color_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.sphere_color_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertex_color), gl.STATIC_DRAW);
    var vColor = gl.getAttribLocation(program, "a_Color");
    gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);
    */
}

function initSphere(gl,program, n_subdivisions) {
    function tetrahedron(a, b, c, d, n)
    {
        divideTriangle(a, b, c, n);
        divideTriangle(d, c, b, n);
        divideTriangle(a, d, b, n);
        divideTriangle(a, c, d, n);
    }
    
    function divideTriangle(a, b, c, count)
    {
        if (count > 0) {
            var ab = normalize(mix(a, b, 0.5), true);
            var ac = normalize(mix(a, c, 0.5), true);
            var bc = normalize(mix(b, c, 0.5), true);
            divideTriangle(a, ab, ac, count - 1);
            divideTriangle(ab, b, bc, count - 1);
            divideTriangle(bc, c, ac, count - 1);
            divideTriangle(ab, bc, ac, count - 1);
        }
        else {
            triangle(a, b, c);
        }
    }
    
    function triangle(a, b, c){
        vertices.push(a);
        vertices.push(b);
        vertices.push(c);
        var o=vec3(0.5,0.5,0.5)
        vertex_color.push(add(mult(vec3(a[0],a[1],a[2]),o),o))
        vertex_color.push(add(mult(vec3(b[0],b[1],b[2]),o),o))
        vertex_color.push(add(mult(vec3(c[0],c[1],c[2]),o),o))
    }

    vertices=[]
    vertex_color=[]

    var va = vec4(0.0, 0.0, -1.0,1);
    var vb = vec4(0.0, 0.942809, 0.333333,1);
    var vc = vec4(-0.816497, -0.471405, 0.333333,1);
    var vd = vec4(0.816497, -0.471405, 0.333333,1);
    tetrahedron(va, vb, vc, vd, n_subdivisions);
    gl.sphere_n_vertices=vertices.length;

    gl.deleteBuffer(gl.sphere_buffer);
    gl.sphere_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.sphere_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    /*
    gl.deleteBuffer(gl.sphere_color_buffer);
    gl.sphere_color_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.sphere_color_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertex_color), gl.STATIC_DRAW);
    var vColor = gl.getAttribLocation(program, "a_Color");
    gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);
    */
    return vertices;
}

window.onload = main;

function initTexture(gl){
    var cubemap = [
        'textures/cm_left.png', // POSITIVE_X
        'textures/cm_right.png', // NEGATIVE_X
        'textures/cm_top.png', // POSITIVE_Y
        'textures/cm_bottom.png', // NEGATIVE_Y
        'textures/cm_back.png', // POSITIVE_Z
        'textures/cm_front.png'// NEGATIVE_Z
    ]; 
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    gl.uniform1i(gl.getUniformLocation(gl.program, "texMap"), 0);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    for(var i = 0; i < 6; ++i) {
        var image = document.createElement('img');
        image.crossorigin = 'anonymous';
        image.textarget = gl.TEXTURE_CUBE_MAP_POSITIVE_X + i;
        image.onload = function (event){
            var image = event.target;
            gl.texImage2D(image.textarget, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
            ++g_tex_ready;
        };
        image.src = cubemap[i];
    }
}