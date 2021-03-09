function main() {
    currentAngle=0;

    var canvas = document.getElementById("canvas");
    var gl = canvas.getContext("webgl");
    //gl.enable(gl.CULL_FACE)
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.frontFace(gl.CW);

    var object_program = initShaders(gl, "object-vertex-shader", "object-fragment-shader");
    var ground_program = initShaders(gl, "ground-vertex-shader", "ground-fragment-shader");


    var model=init_object_shaders(gl,object_program)

    
    var light_alpha=0;
    var pot_heigh_alpha=0;

    var radious=1.5;

    function rotate_camera(){

        var light=get_light(radious,light_alpha);

        var up=vec3(0,1,0);
        var at=vec3(0,1,0);
        var eye;
        eye=vec3(0,-1,-13)
        
        var aspect=canvas.width/canvas.height;

        var object_V =lookAt(eye, at, up);
        var object_P = perspective(40, aspect, 0.1, 10);
        var object_M = translate(0,-0.5*Math.sin(pot_heigh_alpha)-1.5,-3);
        var object_model_view_matrix=mult(mult(object_P,object_V),object_M)

        var light_V =lookAt(vec3(light), at, up);
        var light_P = perspective(130, aspect, 0.1, 15);

        var light_model_view_matrix=mult(mult(light_P,light_V),object_M)
        //object_V=light_V;
        //object_P=light_P;
        
        gl.useProgram(object_program);
        var Mloc=gl.getUniformLocation(object_program, "u_model_view_matrix");
        var Posloc=gl.getUniformLocation(object_program, "u_lightPos");
        update_from_slider(gl,object_program,"u_Le","le_range")
        update_from_slider(gl,object_program,"u_La","alpha_range")
        update_from_slider(gl,object_program,"u_ka","ka_range")
        update_from_slider(gl,object_program,"u_kd","kd_range")
        update_from_slider(gl,object_program,"u_ks","ks_range")
        update_from_slider(gl,object_program,"u_alpha","alpha_range")
        initAttributeVariable(gl, object_program.a_Position, model.vertexBuffer)
        initAttributeVariable(gl, object_program.a_Normal, model.normalBuffer)
        initAttributeVariable(gl, object_program.a_Color, model.colorBuffer)        
        gl.uniform4f(Posloc,light[0],light[1],light[2],light[3]);
        var eye_loc=gl.getUniformLocation(object_program, "u_eye");
        gl.uniform3f(eye_loc,eye[0],eye[1],eye[2]);
        gl.uniform1f(gl.getUniformLocation(object_program, "u_visibility"), 1);   

        var fbo = initFramebufferObject(gl, 512, 512);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.viewport(0, 0, fbo.width, fbo.height);
        gl.uniformMatrix4fv(Mloc, false, flatten(light_model_view_matrix));
        draw_object(gl, object_program,model);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

        gl.uniformMatrix4fv(Mloc, false, flatten(object_model_view_matrix));
        draw_object(gl, object_program,model);

        gl.useProgram(ground_program)
        var object_M = translate(0,-1,-3);   
        gl.uniformMatrix4fv(gl.getUniformLocation(ground_program, "u_P_l"), false, flatten(light_P));
        gl.uniformMatrix4fv(gl.getUniformLocation(ground_program, "u_V_l"), false, flatten(light_V));
        draw_ground(gl,ground_program,object_M,object_P,object_V,fbo)

        if(document.getElementById("moving_pot").checked){
            pot_heigh_alpha=pot_heigh_alpha+0.05;
        }
        if(document.getElementById("moving_light").checked){
            light_alpha=light_alpha+0.05;
        }

        window.requestAnimationFrame(rotate_camera)
    }
    rotate_camera()    
}

function draw_ground(gl,ground_program,M,P,V,fbo){
    var Mloc=gl.getUniformLocation(ground_program, "u_model_view_matrix");
    var vertices = [

        vec3(-2,-1,5),
        vec3(2,-1,5),
        vec3(2,-1,-5),

        vec3(2,-1,-5),
        vec3(-2,-1,-5),
        vec3(-2,-1,5),

    ];
    
    var vBuffer = gl.createBuffer();
    var vPosition = gl.getAttribLocation(ground_program, "a_Position");
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    loadTexture(gl,ground_program,"xamp23.png")

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fbo.texture);
    gl.uniform1i(gl.getUniformLocation(ground_program, "u_shadow_map"), 0);
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
    ]

    var tBuffer = gl.createBuffer();
    var tPosition = gl.getAttribLocation(ground_program, "a_Texcoord");
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(tex_coord), gl.STATIC_DRAW);
    gl.vertexAttribPointer(tPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(tPosition);

    var model_view_matrix=mult(mult(P,V),M)

    gl.drawArrays(gl.TRIANGLES, 0, 8);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.uniformMatrix4fv(Mloc, false, flatten(model_view_matrix));
    gl.uniform1f(gl.getUniformLocation(ground_program, "u_visibility"), 1.0);
}

function init_object_shaders(gl,object_program){
    // Get the storage locations of attribute and uniform variables
    object_program.a_Position = gl.getAttribLocation(object_program, 'a_Position');
    object_program.a_Normal = gl.getAttribLocation(object_program, 'a_Normal');
    object_program.a_Color = gl.getAttribLocation(object_program, 'a_Color');

    // Prepare empty buffer objects for vertex coordinates, colors, and normals
    var model = initVertexBuffers(gl, object_program);
    // Start reading the OBJ file
    readOBJFile('teapot.obj', gl, model, 0.25, true);
    return model
}

function draw_object(gl, program, model) {
    if (!g_drawingInfo && g_objDoc && g_objDoc.isMTLComplete()) {
        g_drawingInfo = onReadComplete(gl, model, g_objDoc);
    }
    if(g_drawingInfo!=null){
        gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length,gl.UNSIGNED_SHORT, 0);
    }
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

function initAttributeVariable(gl, attribute, buffer){
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(attribute, buffer.num, buffer.type, false, 0, 0);
    gl.enableVertexAttribArray(attribute);
}

// Create a buffer object, assign it to attribute variables, and enable the assignment
function createEmptyArrayBuffer(gl, a_attribute, num, type) {
    var buffer = gl.createBuffer(); // Create a buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute); // Enable the assignment
    buffer.num=num;
    buffer.type=type;
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

function get_light(r,alpha){
    return vec4(r*Math.sin(alpha),3,r*Math.cos(alpha),1);
}

function update_from_slider(gl,program,uniform_name,slider){
    slider = document.getElementById(slider)
    var loc=gl.getUniformLocation(program, uniform_name);
    gl.uniform3f(loc,slider.value,slider.value,slider.value);
}

function loadTexture(gl,program,url) {
    var tex = gl.createTexture();
    var img = new Image();

    img.addEventListener('load', function() {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.uniform1i(gl.getUniformLocation(program, "u_ground_tex"), 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    });
    img.src = url;
}

function initFramebufferObject(gl, width, height){
    var framebuffer = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    var renderbuffer = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
    var shadowMap = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, shadowMap);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    framebuffer.texture = shadowMap;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, shadowMap, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) { console.log('Framebuffer object is incomplete: ' + status.toString()); }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    framebuffer.width = width; framebuffer.height = height;
    
    return framebuffer;
}

window.onload = main;
