import {initShaderProgram} from "./shader.js";
import {drawCircle, drawRectangle, drawTriangle, drawLineStrip} from "./shapes2d.js";
import { randomDouble } from "./random.js";


let mode = "point";


function changeDropdown(set_mode) {
    if(set_mode == "point") {
         mode = "point";
    }
    else if(set_mode == "bezier") {
        mode = "bezier";
    }
    else if(set_mode == "move") {
        mode = "move";
    }
    else {
        alert("Invalid mode");
    }

}


main();

async function main() {
    const canvas = document.getElementById("glcanvas");
    const gl = canvas.getContext("webgl");

    if(!gl) {
        alert("WebGL not supported");
    }

    gl.clearColor(0.75, 0.85, 0.8, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);



    const vertexShaderText = await (await fetch("./simple.vs")).text();
    const fragmentShaderText = await (await fetch("./simple.fs")).text();

    let shaderProgram = initShaderProgram(gl, vertexShaderText, fragmentShaderText);
    gl.useProgram(shaderProgram);



    const projectionMatrixUniformLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const projectionMatrix = mat4.create();
    let yhigh = 10;
    let ylow = -yhigh;
    let xlow = ylow;
    let xhigh = yhigh;

    if(aspect>=1) {
        xlow *= aspect;
        xhigh *= aspect;
    }
    else {
        ylow /= aspect;
        yhigh /= aspect;
    }
    mat4.ortho(projectionMatrix, xlow, xhigh, ylow, yhigh, -1, 1);
    gl.uniformMatrix4fv(projectionMatrixUniformLocation, false, projectionMatrix);



    const modelViewMatrixUniformLocation = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
    const modelViewMatrix = mat4.create();
    gl.uniformMatrix4fv(modelViewMatrixUniformLocation, false, modelViewMatrix);






    const radius = 0.1;
    const color = [0,0,0,1];
    const coords = [];
    const tris = [];

    addEventListener("click", click);
    function click(event) {
        console.log("click");
        const xWorld = xlow + event.offsetX / gl.canvas.clientWidth * (xhigh - xlow);
        const yWorld = ylow + (gl.canvas.clientHeight - event.offsetY) / gl.canvas.clientHeight * (yhigh - ylow);

        console.log(xWorld, yWorld);
        console.log("client_width: ", gl.canvas.clientWidth);

        if(mode === "point")
        {
            if(yWorld <= gl.canvas.clientHeight)
            {
                drawCircle(gl, shaderProgram, xWorld, yWorld, radius, color);
                coords.push([xWorld, yWorld]);

            }

        }
        if(mode === "bezier")
        {
            drawTriangle(gl, shaderProgram, xWorld, yWorld, xWorld+radius, yWorld, xWorld, yWorld+radius, color);
            tris.push([xWorld, yWorld, xWorld+radius, yWorld, xWorld, yWorld+radius]);
        }
    }


    let previousTime = 0;

    function redraw(currentTime) {
        currentTime *= .001;
        let DT = currentTime - previousTime;
        if(DT > .1)
            DT = .1;
        previousTime = currentTime;


        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const line = [];

        for(let i = 0; i < coords.length; i++)
        {
            drawCircle(gl, shaderProgram, coords[i][0], coords[i][1], radius, color);
            coords.forEach(coord => {
                line.push(coord[0]);
                line.push(coord[1]);

            });
            drawLineStrip(gl, shaderProgram, line, color);

        }

        for(let i = 0; i < tris.length; i++)
        {
            drawTriangle(gl, shaderProgram, tris[i][0], tris[i][1], tris[i][2], tris[i][3], tris[i][4], tris[i][5], color);
        }

        requestAnimationFrame(redraw);




    }

    requestAnimationFrame(redraw);





}


export {changeDropdown};