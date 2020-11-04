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

    function rotate_camera(){
        var eye=get_eye(radious,alpha);
        var eye_loc=gl.getUniformLocation(program, "u_eye");
        gl.uniform3f(eye_loc,eye[0],eye[1],eye[2]);

        alpha=alpha+0.1;
        var V =lookAt(eye, at, up);
        var P = perspective(45, aspect, 0.1, 10);
        
        var model_view_matrix=mult(P,V)
    
        var Mloc=gl.getUniformLocation(program, "u_model_view_matrix");
        gl.uniformMatrix4fv(Mloc, false, flatten(model_view_matrix)); 
        render(gl,vertices.length);
        window.requestAnimationFrame(rotate_camera);
    }
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

    var le_range = document.getElementById("le_range");
    le_range.addEventListener("input", function (ev) {
        update_from_slider(gl,program,"u_Le","le_range")
    });
    var la_range = document.getElementById("la_range");
    la_range.addEventListener("input", function (ev) {
        update_from_slider(gl,program,"u_La","la_range")
    });
    var ka_range = document.getElementById("ka_range");
    ka_range.addEventListener("input", function (ev) {
        update_from_slider(gl,program,"u_ka","ka_range")
    });
    var kd_range = document.getElementById("kd_range");
    kd_range.addEventListener("input", function (ev) {
        update_from_slider(gl,program,"u_kd","kd_range")
    });
    var ks_range = document.getElementById("ks_range");
    ks_range.addEventListener("input", function (ev) {
        update_from_slider(gl,program,"u_ks","ks_range")
    });
    var alpha_range = document.getElementById("alpha_range");
    alpha_range.addEventListener("input", function (ev) {
        update_from_slider(gl,program,"u_alpha","alpha_range")
    });
}
function update_from_slider(gl,program,uniform_name,slider){
    slider = document.getElementById(slider)
    console.log(uniform_name+slider.value);
    var loc=gl.getUniformLocation(program, uniform_name);
    gl.uniform3f(loc,slider.value,slider.value,slider.value);
}
function render(gl, n_vertices){
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);    
    gl.drawArrays(gl.TRIANGLES, 0, n_vertices);
}
function get_eye(r,alpha){
    return vec3(r*Math.sin(alpha),0,r*Math.cos(alpha));
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

    light=vec4(0,0,-1,0);
    var Posloc=gl.getUniformLocation(program, "u_lightPos");
    gl.uniform4f(Posloc,light[0],light[1],light[2],light[3]);
    
    update_from_slider(gl,program,"u_Le","le_range")
    update_from_slider(gl,program,"u_La","alpha_range")
    update_from_slider(gl,program,"u_ka","ka_range")
    update_from_slider(gl,program,"u_kd","kd_range")
    update_from_slider(gl,program,"u_ks","ks_range")
    update_from_slider(gl,program,"u_alpha","alpha_range")

    vertices=[]
    vertex_color=[]

    var va = vec4(0.0, 0.0, -1.0,1);
    var vb = vec4(0.0, 0.942809, 0.333333,1);
    var vc = vec4(-0.816497, -0.471405, 0.333333,1);
    var vd = vec4(0.816497, -0.471405, 0.333333,1);
    tetrahedron(va, vb, vc, vd, n_subdivisions);
    gl.deleteBuffer(gl.vbuffer);
    gl.vbuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.vbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    gl.deleteBuffer(gl.cbuffer);
    gl.cbuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.cbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertex_color), gl.STATIC_DRAW);
    var vColor = gl.getAttribLocation(program, "a_Color");
    gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);
    return vertices;
}

window.onload = main;