function main(){
    n_subdivisions=1;

    var canvas = document.getElementById("canvas");
    var gl = canvas.getContext("webgl");
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    
    var up=vec3(0,1,0);
    var eye=vec3(0,0,3);
    var at=vec3(0,0,0);

    aspect=canvas.width/canvas.height;
    var V =lookAt(eye, at, up);
    var P = perspective(45, aspect, 0.1, 10);
    var M =translate(0,1,0);
    
    var model_view_matrix=mult(P,V)

    var Mloc=gl.getUniformLocation(program, "u_model_view_matrix");
    gl.uniformMatrix4fv(Mloc, false, flatten(model_view_matrix)); 
    vertices=initSphere(gl, program, n_subdivisions);
    render(gl,vertices.length);

    var inc_button = document.getElementById("inc_button");
    inc_button.addEventListener("click", function (ev) {
        n_subdivisions+=1;
        initSphere(gl, program, n_subdivisions)
        render(gl,vertices.length);
    });

    var inc_button = document.getElementById("dec_button");
    inc_button.addEventListener("click", function (ev) {
        if (n_subdivisions>1){
            n_subdivisions-=1;
            initSphere(gl, program, n_subdivisions)
            render(gl,vertices.length);
        }
    });

}
function render(gl, n_vertices){
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);    
    gl.drawArrays(gl.TRIANGLES, 0, n_vertices);
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
    }

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
    
    return vertices;
}

window.onload = main;