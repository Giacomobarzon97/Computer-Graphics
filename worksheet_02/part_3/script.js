function main(){
    var max_verts = 1000;
    var index = 0; 

    var canvas = document.getElementById("canvas");
    var gl = canvas.getContext("webgl");

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, max_verts*sizeof['vec2'], gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var color_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, max_verts*sizeof['vec4'], gl.STATIC_DRAW);
    var vColor = gl.getAttribLocation(program, "a_Color");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);
    
    var point_indices=[];

    var triangle_vertexes=[];
    var triangle_vertex_indices=[];

    function remove_by_value(arr,value){
        var index = arr.indexOf(value);

        if (index > -1) {
           arr.splice(index, 1);
        }
        return arr;
    }

    function remove_duplicates(value){
        point_indices=remove_by_value(point_indices,index);
        point_triangle_vertex_indices=indices=remove_by_value(triangle_vertex_indices,index);
    }

    canvas.addEventListener("click", function (ev) {
        mousepos = get_mouse_position(ev,canvas);

        if(get_drawing_mode()=="point"){
            remove_duplicates(index)
            create_point(index,mousepos,gl,vBuffer,color_buffer);
            point_indices.push(index);
            index=(index+1)%max_verts;
        }
        if(get_drawing_mode()=="triangle"){
            triangle_vertexes.push(mousepos);

            if (triangle_vertexes.length==3){
                remove_duplicates(index)
                create_point(index,triangle_vertexes[0],gl,vBuffer,color_buffer);
                create_point((index+1)%max_verts,triangle_vertexes[1],gl,vBuffer,color_buffer);
                create_point((index+2)%max_verts,triangle_vertexes[2],gl,vBuffer,color_buffer);

                triangle_vertex_indices.push(index);
                index=(index+3)%max_verts;
                triangle_vertexes=[];
            }
        }
        render(gl,point_indices,triangle_vertex_indices)
    });

    clear_button=document.getElementById("clear_button");
    clear_button.addEventListener("click", function(ev){
        index=0;
        point_indices=[];
        triangle_vertex_indices=[];
        triangle_vertexes=[];
        render(gl,point_indices,triangle_vertex_indices);
    });

    render(gl,point_indices,triangle_vertex_indices);
}

function create_point(index,point,gl,vBuffer,color_buffer){
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec2'], flatten(point));
    gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, index*sizeof['vec4'], flatten(get_point_color()));
}

function render(gl, point_indices, triangle_vertex_indices){
    background_color=get_background_color();
    gl.clearColor(background_color[0],background_color[1],background_color[2],background_color[3]);
    gl.clear(gl.COLOR_BUFFER_BIT);
    first=point_indices[0];
    console.log(triangle_vertex_indices)
    for(i=0;i<point_indices.length; i++){
        gl.drawArrays(gl.POINTS,point_indices[i],1);
    }
    for(i=0;i<triangle_vertex_indices.length; i++){
        gl.drawArrays(gl.TRIANGLES,triangle_vertex_indices[i],3);
    }
}

function get_mouse_position(ev,canvas){
    var bbox = ev.target.getBoundingClientRect();
    return vec2(2*(ev.clientX - bbox.left)/canvas.width - 1, 2*(canvas.height - ev.clientY + bbox.top - 1)/canvas.height - 1);
}

function get_background_color(){
    var background_red=document.getElementById("background_red");
    var background_green=document.getElementById("background_green");
    var background_blue=document.getElementById("background_blue");

    return vec4(background_red.value, background_green.value, background_blue.value, 1)
}

function get_point_color(){
    var point_red=document.getElementById("point_red");
    var point_green=document.getElementById("point_green");
    var point_blue=document.getElementById("point_blue");

    return vec4(point_red.value, point_green.value, point_blue.value, 1)
}

function get_drawing_mode(){
    return document.getElementById("drawing_mode").value;
}

window.onload = main;