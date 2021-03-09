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

    currentAngle=[0,0]
    initEventHandlers(canvas, currentAngle)

    function rotate_camera(){
        draw(gl, program,model);
        window.requestAnimationFrame(rotate_camera);
    }
    rotate_camera()
}
function draw(gl, program,model,eye) {
    var alpha=1;
    var up=vec3(0,1,0);
    var at=vec3(0,0,0);
    var eye=vec3(4,0,4)

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
        model_view_matrix=mult(model_view_matrix,rotate(currentAngle[0],vec4(1, 0, 0.0, 0.0)))
        model_view_matrix=mult(model_view_matrix,rotate(currentAngle[1],vec4(0, 1, 0.0, 0.0)))
    
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


function initEventHandlers(canvas, currentAngle) {
    var dragging = false; // Dragging or not
    var lastX = -1, lastY = -1; // Last position of the mouse

    canvas.onmousedown = function(ev) { // Mouse is pressed
        var x = ev.clientX, y = ev.clientY;
        // Start dragging if a mouse is in <canvas>
        var rect = ev.target.getBoundingClientRect();
        if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
            lastX = x; lastY = y;
            dragging = true;
        }
    };
    // Mouse is released
    canvas.onmouseup = function(ev) { dragging = false; };
    canvas.onmousemove = function(ev) { // Mouse is moved
        var x = ev.clientX, y = ev.clientY;
        if (dragging) {
            var factor = 100/canvas.height; // The rotation ratio
            var dx = factor * (x - lastX);
            var dy = factor * (y - lastY);
            // Limit x-axis rotation angle to -90 to 90 degrees
            currentAngle[0] = Math.max(Math.min(currentAngle[0] + dy, 90.0), -90.0);
            currentAngle[1] = currentAngle[1] + dx;
        }
        lastX = x, lastY = y;
    };
}

function get_eye(r,alpha){
    return vec3(r*Math.sin(alpha),0,r*Math.cos(alpha));
}

window.onload = main;
