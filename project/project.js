function modifyProjectionMatrix(clipplane, projection) {
    // MV.js has no copy constructor for matrices
    var oblique = mult(mat4(), projection);
    var q = vec4((Math.sign(clipplane[0]) + projection[0][2])/projection[0][0],
    (Math.sign(clipplane[1]) + projection[1][2])/projection[1][1],
    -1.0,
    (1.0 + projection[2][2])/projection[2][3]);
    var s = 2.0/dot(clipplane, q);
    oblique[2] = vec4(clipplane[0]*s, clipplane[1]*s,
    clipplane[2]*s + 1.0, clipplane[3]*s);
    return oblique;
}


function normalizeVector(vec) {
    var mag = Math.sqrt(vec[0]*vec[0]+vec[1]*vec[1]+vec[2]*vec[2]);
    console.log(mag);

    return vec3(vec[0]/mag, vec[1]/mag, vec[2]/mag);
}

function createEmptyArrayBuffer(gl, a_attribute, num, type) {
    var buffer = gl.createBuffer(); // Create a buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute); // Enable the assignment
    return buffer;
}

function initAttributeVariable(gl, a_attribute, buffer, num) { //asssign values into buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, num, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);
}




const shadowSize = 1024;

function initFramebufferObject(gl) {
    var framebuffer, texture, depthBuffer;

    framebuffer = gl.createFramebuffer();

    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture); //binding a texture to an active texture
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, shadowSize, shadowSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);//Create a one-color-texture
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);//(texture target, symbolic name of a texture parameter, )
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    framebuffer.texture = texture;

    depthBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, shadowSize, shadowSize);

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

    //var e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    //if (e !== gl.FRAMEBUFFER_COMPLETE) {
    //    console.log('Framebuffer object is incomplete: ' + e.toString());
    //    return error();
    //}

    return framebuffer;
}

window.onload = function init() {
    var g_objDoc = null; // The information of OBJ file
    var g_drawingInfo = null; // The information for drawing 3D model


    // Obj File has been read
    function onReadOBJFile(fileString, fileName, gl, o, scale, reverse) {
        var objDoc = new OBJDoc(fileName); //Create an OBJDoc object
        var result = objDoc.parse(fileString, scale, reverse);
        if (!result) {
            g_objDoc = null;
            g_drawingInfo = null;
            console.log("OBJ file parsing error.");
            return;
        }
        g_objDoc = objDoc;
    }

    // read a file
    function readOBJFile(fileName, gl, model, scale, reverse) {
        var request = new XMLHttpRequest();

        request.onreadystatechange = function() {
            if (request.readyState == 4 && request.status !== 404) {
                onReadOBJFile(request.responseText, fileName, gl, model, scale, reverse);
            }
        }
        request.open("GET", fileName, true); //Create a request to get file
        request.send();
    }

    // OBJ File has been read completely
    function onReadComplete(gl, model, objDoc) {

        // Acquire the vertex coordinates and colors from OBJ file
        var drawingInfo = objDoc.getDrawingInfo();
        // Write date into the buffer object
        gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);

        // Write the indices to the buffer object
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);

        return drawingInfo;
    }


    // Prepare WebGL
    var canvas = document.getElementById("canvas");

    //stencil buffer
    var gl = WebGLUtils.setupWebGL(canvas, { alpha: false, stencil: true });
    gl.clear(gl.STENCIL_BUFFER_BIT);


    // TEAPOT SHADERS

    // Load shaders
    var teapotProgram = initShaders(gl, "vertex-shader-teapot", "fragment-shader-teapot");
    gl.useProgram(teapotProgram);

    teapotProgram.position = gl.getAttribLocation(teapotProgram, 'position');
    teapotProgram.color = gl.getAttribLocation(teapotProgram, 'color');
    teapotProgram.normal = gl.getAttribLocation(teapotProgram, 'normal');
    teapotProgram.shadow = gl.getUniformLocation(teapotProgram, 'shadow');//retrieving the location of the shdow variable from html
    //uniform1i because we pass 1 parameter and "i" because is an integer the value that we pass
    gl.uniform1i(teapotProgram.shadow, 1);//we applying the value 1 to the shadow

    var teapotModel = { //create buffers related to the object
        vertexBuffer: createEmptyArrayBuffer(gl, teapotProgram.position, 3, gl.FLOAT),
        normalBuffer: createEmptyArrayBuffer(gl, teapotProgram.normal, 3, gl.FLOAT),
        colorBuffer: createEmptyArrayBuffer(gl, teapotProgram.color, 4, gl.FLOAT),
        indexBuffer: gl.createBuffer()
    }


    readOBJFile('teapot/teapot.obj', gl, teapotModel, 1, true);

    // TEAPOT SHADOWS

    let shadowProgram = initShaders(gl, "vertex-shader-shadow", "fragment-shader-shadow");
    gl.useProgram(shadowProgram);

    shadowProgram.position = gl.getAttribLocation(shadowProgram, 'position');

    var fb = initFramebufferObject(gl);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, fb.texture);

    // TERRAIN SHADERS

    // Load shaders
    let groundProgram = initShaders(gl, "vertex-shader-ground", "fragment-shader-ground");
    gl.useProgram(groundProgram);

    groundProgram.position = gl.getAttribLocation(groundProgram, 'position');
    groundProgram.texPosition = gl.getAttribLocation(groundProgram, 'texPosition');
    groundProgram.texture = gl.getUniformLocation(groundProgram, 'texture');
    groundProgram.shadow = gl.getUniformLocation(groundProgram, 'shadow');

    // vertices of the terrain
    const vertices = [vec3(-2, -1, -1), vec3(-2, -1, -5), vec3(2, -1, -5), vec3(2, -1, -1)];


    // coordinates of the texture
    const texCoords = [vec2(-1, -1), vec2(-1, 1), vec2(1, 1), vec2(1, -1)];
    //
    const indices = [0, 3, 2, 0, 2, 1];
    //perpendicular vector of the plane
    const u = cross(vec3(0,0,-4),vec3(4,0,4));
        console.log(u);
    
    const V=normalizeVector(u);
    //console.log(V);


    const R = mat4(vec4(1-2*V[0]*V[0],-2*V[0]*V[1],-2*V[0]*V[2], 2*(dot(vertices[0], V)*V[0])),
                   vec4(-2*V[0]*V[1], 1-2*V[1]*V[1], -2*V[1]*V[2], 2*(dot(vertices[0], V)*V[1])),
                   vec4(-2*V[0]*V[2], -2*V[1]*V[2], 1-2*V[2]*V[2], 2*(dot(vertices[0], V)*V[2])),
                   vec4(0,0,0,1)); //reflected matrix (mat4 = matrix 4x4) (vec4 = vector of 4)
    //console.log(R);
    const planeEq= vec4(0,-16,0,-21);//-21



    


    //variable for the terrain model. 
    var groundModel = {};
    //insert in the ground model all the useful info
    groundModel.vertexBuffer = createEmptyArrayBuffer(gl, groundProgram.position, 3, gl.FLOAT);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);//Assign to the ground position the actual vertices

    groundModel.texCoordsBuffer = createEmptyArrayBuffer(gl, groundProgram.texPosition, 2, gl.FLOAT);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);
    //TO REVIEW indexes for the rendering
    groundModel.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, groundModel.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);

    // image texture
    var image = document.createElement('img');
    image.crossorigin = 'anonymous';
    image.onload = e => {
        console.log("Texture loaded");
        let texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.uniform1i(groundProgram.texture, 0);
        gl.uniform1i(groundProgram.shadow, 1);

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

        gl.generateMipmap(gl.TEXTURE_2D);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

        window.requestAnimationFrame(render);
    };
    image.src = 'textures/xamp23.png';

    // INPUTS buttons initialization and actions

    const bounceCheck = document.getElementById("bounce2");
    bounceCheck.onchange = x => {
        bounce = bounceCheck.checked;
    };
    var bounce = bounceCheck.checked;

    const lookDownCheck = document.getElementById("lookDown2");
    lookDownCheck.onchange = x => {
        lookDown = lookDownCheck.checked;
    };
    var lookDown = lookDownCheck.checked;

    const lightMoveCheck = document.getElementById("lightMove2");
    lightMoveCheck.onchange = x => {
        lightMove = lightMoveCheck.checked;
    };
    var lightMove = lightMoveCheck.checked;


    // Projection shadow matrix

    let lightY = 3;

    

    function render(time) {

        function renderColorPlane(){
            // RENDER COLORFUL GROUND
            gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.useProgram(groundProgram);
        
            initAttributeVariable(gl, groundProgram.position, groundModel.vertexBuffer, 3);
            initAttributeVariable(gl, groundProgram.texPosition, groundModel.texCoordsBuffer, 2);
        
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, groundModel.indexBuffer);
        
            // ground matrices
            uLocation = gl.getUniformLocation(groundProgram, 'perspective');
            gl.uniformMatrix4fv(uLocation, false, flatten(cameraPerspective));
        
            uLocation = gl.getUniformLocation(groundProgram, 'modelView');
            gl.uniformMatrix4fv(uLocation, false, flatten(mat4()));
        
            uLocation = gl.getUniformLocation(groundProgram, 'lightModelView');
            gl.uniformMatrix4fv(uLocation, false, flatten(mat4()));
        
            uLocation = gl.getUniformLocation(groundProgram, 'lightPerspective');
            gl.uniformMatrix4fv(uLocation, false, flatten(lightPerspective));
        
        
            gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0);
        }


        function renderTeapot(reflected){
            // TEAPOT PART
            //Since browser programs do not wait for data to load, you need to wait for the data 
            //before using it in the render function that you are calling for every frame -- from worksheet 5
            if (!g_drawingInfo && g_objDoc && g_objDoc.isMTLComplete()) {

                // OBJ and all MTLs are available
                g_drawingInfo = onReadComplete(gl, teapotModel, g_objDoc);
                console.log("g_drawingInfo set!");
                console.log(g_drawingInfo.indices.length);
            }

            if (!g_drawingInfo) {
                console.log('waiting');
            } else {
                // RENDER SHADOW MAP
                gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
                gl.useProgram(shadowProgram);
                initAttributeVariable(gl, shadowProgram.position, teapotModel.vertexBuffer, 3);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapotModel.indexBuffer);

                let uLocation = gl.getUniformLocation(shadowProgram, 'modelView');
                gl.uniformMatrix4fv(uLocation, false, flatten(teapotModelView));

                uLocation = gl.getUniformLocation(shadowProgram, 'perspective');
                gl.uniformMatrix4fv(uLocation, false, flatten(lightPerspective));

                if(!reflected){
                    gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);

                }
                
                // RENDER THE TEAPOT
                gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                gl.useProgram(teapotProgram);

                initAttributeVariable(gl, teapotProgram.position, teapotModel.vertexBuffer, 3);
                initAttributeVariable(gl, teapotProgram.normal, teapotModel.normalBuffer, 3);
                initAttributeVariable(gl, teapotProgram.color, teapotModel.colorBuffer, 4);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, teapotModel.indexBuffer);

                
                uLocation = gl.getUniformLocation(teapotProgram, 'modelView');
                gl.uniformMatrix4fv(uLocation, false, flatten(teapotModelView));
            
                uLocation = gl.getUniformLocation(teapotProgram, 'perspectiveMatrix');
                gl.uniformMatrix4fv(uLocation, false, flatten( cameraPerspective));

                uLocation = gl.getUniformLocation(teapotProgram, 'lightModelView');
                gl.uniformMatrix4fv(uLocation, false, flatten(teapotModelView));
            
                uLocation = gl.getUniformLocation(teapotProgram, 'lightPerspective');
                gl.uniformMatrix4fv(uLocation, false, flatten(lightPerspective));
            
                uLocation = gl.getUniformLocation(teapotProgram, 'lightPosition');
                gl.uniform3f(uLocation, lightX, lightY, lightZ);

                var geomTeapot = [
                    R, //X,Y,Z
                    teapotModelView //scale of the object
                ].reduce(mult);

                var geomLight = [
                    R, //X,Y,Z
                    teapotModelView //scale of the object
                ].reduce(mult);

                    
                if (reflected){
                    //teapot reflected
                    uLocation = gl.getUniformLocation(teapotProgram, 'modelView');               
                    gl.uniformMatrix4fv(uLocation, false, flatten(geomTeapot));
                    uLocation = gl.getUniformLocation(teapotProgram, 'lightModelView');
                    gl.uniformMatrix4fv(uLocation, false, flatten(geomLight));
                    uLocation = gl.getUniformLocation(teapotProgram, 'perspectiveMatrix');
                    gl.uniformMatrix4fv(uLocation, false, flatten(modifyProjectionMatrix(planeEq, cameraPerspective)));
                    gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
                    gl.clear(gl.DEPTH_BUFFER_BIT);
                }
                else{
                    //teapot original
                    gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
                }


            }
        }



        // background
        gl.clearColor(0.53, 0.81, 1.0, 1.0);
        gl.clearStencil(0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT| gl.STENCIL_BUFER_BIT);
        gl.enable(gl.DEPTH_TEST);

        //gl.enable(gl.DEPTH_BUFFER_BIT);
        gl.disable(gl.STENCIL_TEST);
        
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // light updates
        let t = time / 1000;
        let lightX, lightZ;

        if (lightMove) {//variabe from the check box
            lightX = 2 * Math.sin(t);
            lightZ = -3 + 2 * Math.cos(t);
        } else {
            lightX = 0;
            lightZ = -2.999;
        }

        // common perspective + lookAt
        let cameraPerspective = [
            perspective(65, 1, 0.1, 20), //(fovy, aspect, near, far) = (Field-of-view (y axis), aspect ratio (width/height), distance of view from the front,distance of view from the back  )
            //the if is used to use another vector for the "eye" matrix instead of the original one
            lookAt(lookDown ? vec3(0, 2, -2.99) : vec3(0, 0, 1), vec3(0, 0, -3), vec3(0, 1, 0)),//lookAt(eye, at, up) (camera position, direction of looking, inclination of the camera )
        ].reduce(mult);

        let lightPerspective = [
            perspective(90, 1, 1, 20),
            lookAt(vec3(lightX, lightY, lightZ), vec3(0, 0, -3), vec3(0, 1, 0)),
        ].reduce(mult);

        // teapot model view matrix
        let transY = bounce ? Math.abs(Math.cos(t))-1.5: -1.5; //if it bounce, save the moltiplication. If it's not bouncing save zero 
        var teapotModelView = [
            translate(0, transY, -3), //X,Y,Z
            scalem(0.25, 0.25, 0.25) //scale of the object
        ].reduce(mult);
        //console.log(teapotModelView);

        // RENDER GROUND SHADOW
        gl.viewport(0,0, shadowSize, shadowSize);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);//bind the frame buffer depending if the light is turn on or not
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(shadowProgram);
        initAttributeVariable(gl, shadowProgram.position, groundModel.vertexBuffer, 3);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, groundModel.indexBuffer);

        
        let uLocation = gl.getUniformLocation(shadowProgram, 'modelView');
        gl.uniformMatrix4fv(uLocation, false, flatten(mat4()));

        uLocation = gl.getUniformLocation(shadowProgram, 'perspective');
        gl.uniformMatrix4fv(uLocation, false, flatten(lightPerspective));


        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0);


        renderTeapot(false);

        gl.enable(gl.STENCIL_TEST);
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
        gl.stencilFunc(gl.ALWAYS, 1, ~0);
        gl.colorMask(0,0,0,0)
        renderColorPlane();

        gl.depthRange(1,1);
        gl.depthFunc(gl.ALWAYS);
        gl.stencilFunc(gl.EQUAL, 1, ~0); 
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP); 
        renderColorPlane();

        gl.depthFunc(gl.LESS);
        gl.colorMask(1,1,1,1);
        gl.colorMask(1,1,1,1);
        gl.depthRange(0,1);

        
        renderTeapot(true);
        renderColorPlane();


        gl.colorMask(0,0,0,0);
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.ZERO);
        gl.depthFunc(gl.ALWAYS);
        renderColorPlane();
        gl.depthFunc(gl.LESS);
        gl.colorMask(1,1,1,1);

        window.requestAnimationFrame(render);
    }


}