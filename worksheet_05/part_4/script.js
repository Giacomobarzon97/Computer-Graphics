function main() {
    currentAngle=0;

    var canvas = document.getElementById("canvas");
    var gl = canvas.getContext("webgl");
    var program = initShaders(gl, "vertex-shader", "fragment-shader");

    program.a_Position = gl.getAttribLocation(program, 'a_Position');
    program.a_Normal = gl.getAttribLocation(program, 'a_Normal');
    program.a_Color = gl.getAttribLocation(program, 'a_Color');

    gl.useProgram(program);
    //gl.enable(gl.CULL_FACE)
    gl.enable(gl.DEPTH_TEST);
    gl.frontFace(gl.CW);

    // Get the storage locations of attribute and uniform variables
    program.a_Position = gl.getAttribLocation(program, 'a_Position');
    program.a_Normal = gl.getAttribLocation(program, 'a_Normal');
    program.a_Color = gl.getAttribLocation(program, 'a_Color');

    // Prepare empty buffer objects for vertex coordinates, colors, and normals
    var model = initVertexBuffers(gl, program);
    // Start reading the OBJ file
    readOBJFile('monkey.obj', gl, model, 1, true);

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
    
    update_from_slider(gl,program,"u_Le","le_range")
    update_from_slider(gl,program,"u_La","alpha_range")
    update_from_slider(gl,program,"u_ka","ka_range")
    update_from_slider(gl,program,"u_kd","kd_range")
    update_from_slider(gl,program,"u_ks","ks_range")
    update_from_slider(gl,program,"u_alpha","alpha_range")

    alpha=0;
    radious=4;
    function rotate_camera(){
        eye=get_eye(radious,alpha)
        alpha=alpha+0.05;

        draw(gl, program,model,eye);
        window.requestAnimationFrame(rotate_camera);
    }
    rotate_camera()
}
function draw(gl, program,model,eye) {
    var alpha=1;
    var up=vec3(0,1,0);
    var at=vec3(0,0,0);
    aspect=canvas.width/canvas.height;

    light=vec4(0,0,1,0);
    var Posloc=gl.getUniformLocation(program, "u_lightPos");
    gl.uniform4f(Posloc,light[0],light[1],light[2],light[3]);

    if (!g_drawingInfo && g_objDoc && g_objDoc.isMTLComplete()) {
        g_drawingInfo = onReadComplete(gl, model, g_objDoc);
    }

    if(g_drawingInfo!=null){
        var eye_loc=gl.getUniformLocation(program, "u_eye");
        gl.uniform3f(eye_loc,eye[0],eye[1],eye[2]);

        alpha=alpha+0.01;
        var V =lookAt(eye, at, up);
        var P = perspective(45, aspect, 0.1, 10);
        
        var model_view_matrix=mult(P,V)
    
        var Mloc=gl.getUniformLocation(program, "u_model_view_matrix");
        gl.uniformMatrix4fv(Mloc, false, flatten(model_view_matrix));
        render(gl, g_drawingInfo.indices.length)
    }
}

function render(gl, n_vertices){
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    //gl.drawArrays(gl.TRIANGLES, 0, n_vertices);
    gl.drawElements(gl.TRIANGLES, n_vertices,gl.UNSIGNED_SHORT, 0);
}

// Create a buffer object and perform the initial configuration
function initVertexBuffers(gl, program) {
    var o = new Object();
    o.vertexBuffer = createEmptyArrayBuffer(gl, program.a_Position, 3, gl.FLOAT);
    o.normalBuffer = createEmptyArrayBuffer(gl, program.a_Normal, 3, gl.FLOAT);
    o.colorBuffer = createEmptyArrayBuffer(gl, program.a_Color, 4, gl.FLOAT);
    o.indexBuffer = gl.createBuffer();
    return o;
}

// Create a buffer object, assign it to attribute variables, and enable the assignment
function createEmptyArrayBuffer(gl, a_attribute, num, type) {
    var buffer = gl.createBuffer(); // Create a buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute); // Enable the assignment
    return buffer;
}
// Read a file
function readOBJFile(fileName, gl, model, scale, reverse) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (request.readyState === 4 && request.status !== 404) {
          onReadOBJFile(request.responseText, fileName, gl, model, scale, reverse);
        }
    }
    request.open('GET', fileName, true); // Create a request to get file
    request.send(); // Send the request
}
var g_objDoc = null; // The information of OBJ file
var g_drawingInfo = null; // The information for drawing 3D model
// OBJ file has been read
function onReadOBJFile(fileString, fileName, gl, o, scale, reverse) {
    var objDoc = new OBJDoc(fileName); // Create a OBJDoc object
    var result = objDoc.parse(fileString, scale, reverse);
    if (!result) {
        g_objDoc = null; g_drawingInfo = null;
        console.log("OBJ file parsing error.");
        return;
    }
    g_objDoc = objDoc;
}

function onReadComplete(gl, model, objDoc) {
    // Acquire the vertex coordinates and colors from OBJ file
    var drawingInfo = objDoc.getDrawingInfo();

    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices,gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);

    // Write the indices to the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);

    return drawingInfo;
}

function get_eye(r,alpha){
    return vec3(r*Math.sin(alpha),0,r*Math.cos(alpha));
}

function update_from_slider(gl,program,uniform_name,slider){
    slider = document.getElementById(slider)
    var loc=gl.getUniformLocation(program, uniform_name);
    gl.uniform3f(loc,slider.value,slider.value,slider.value);
}

window.onload = main;
