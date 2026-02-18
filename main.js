import {initShaderProgram} from "./shader.js";
import {drawCircle, CreateCircleVertices, drawRectangle, drawTriangle, drawLineStrip} from "./shapes2d.js";
import { randomDouble } from "./random.js";


let mode = "point";


let clicked = false;


function withinPoint(x, y, cx, cy, radius)
{
    const dx = x - cx;
    const dy = y - cy;
    return dx*dx + dy*dy <= radius*radius;
}


function cubicBezier(p0, p1, p2, p3, t) {
    const u = 1 - t;

    const x = u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0];


    const y = u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1];


    return [x, y];
}


function buildBezierCurve(points, samples = 100) {
    if (points.length < 4) return [];

    const curve = [];

    for(let i = 0; i <= samples; i++) {
        const t = i / samples;
        const p = cubicBezier(points[0], points[1], points[2], points[3], t);
        curve.push(p);
    }

    return curve;
}


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
    const coords = [[-3.017656500802568, -3.48692403486924], [4.641350210970465, 4.177215189873419]];
    const tris = [[coords[0], [-0.04219409282700326, 4.746835443037975], [0.3797468354430382, -3.5021097046413505], coords[1]]];

    const ps = [[false, false, false, false]];

    let the_inc = 0;
    function add_bezier() {

        coords.push([coords[the_inc][0] + 3, coords[the_inc][1] + 3]);
        coords.push([coords[the_inc + 1][0] + 3, coords[the_inc + 1][1] + 3]);
        tris.push(
            [[tris[the_inc][0][0] + 3, tris[the_inc][0][1] + 3],
            [tris[the_inc][1][0] + 3, tris[the_inc][1][1] + 3],
            [tris[the_inc][2][0] + 3,tris[the_inc][2][1] + 3],
            [tris[the_inc][3][0] + 3,tris[the_inc][3][1] + 3]]
        );

        ps.push([false, false, false, false]);
        mode = "point";
        the_inc += 1;

    }


    let xWorld = 0;
    let yWorld = 0;


    addEventListener("mousedown", click);
    function click(event) {
        clicked = true;


        xWorld = xlow + event.offsetX / gl.canvas.clientWidth * (xhigh - xlow);
        yWorld = ylow + (gl.canvas.clientHeight - event.offsetY) / gl.canvas.clientHeight * (yhigh - ylow);

        for(let i = 0; i < tris.length; i++) {
            for(let j = 0; j < tris[i].length; j++) {
                if(withinPoint(xWorld, yWorld, tris[i][j][0], tris[i][j][1], radius)) {
                    ps[i][j] = true;
                }
            }
        }



    }


    addEventListener("mouseup", stop);
    function stop(event) {
        clicked = false;
        for(let i = 0; i < tris.length; i++) {
            for(let j = 0; j < tris[i].length; j++) {
                ps[i][j] = false;
            }

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


        if(mode == "bezier") {
            add_bezier();
        }

        if(clicked) {
            addEventListener("mousemove", move);
            function move(event) {

                if(clicked) {
                    xWorld = xlow + event.offsetX / gl.canvas.clientWidth * (xhigh - xlow);
                    yWorld = ylow + (gl.canvas.clientHeight - event.offsetY) / gl.canvas.clientHeight * (yhigh - ylow);

                }



            }



        }

        const line = [];

        /*for(let i = 0; i < coords.length; i++)
        {
            drawCircle(gl, shaderProgram, coords[i][0], coords[i][1], radius, color);


        } */

        for(let i = 0; i < tris.length; i++)
        {
            for(let j = 0; j < tris[i].length; j++) {
                if(ps[i][j])
                {
                    tris[i][j][0] = xWorld;
                    tris[i][j][1] = yWorld;
                }
                drawCircle(gl, shaderProgram, tris[i][j][0], tris[i][j][1], radius, color);

            }

        }


        for(let i = 0; i < tris.length; i++) {
            const curve = buildBezierCurve(tris[i]);

            const new_line = [];

            for(let j = 0; j < curve.length; j += 2) {
                //line.push(curve[j][0], curve[j][1]);
                new_line.push(curve[j][0], curve[j][1]);

                //drawLineStrip(gl, shaderProgram, line, color);


            }

            line.push(new_line);

            for(let j = 0; j < line.length; j += 1) {
                drawLineStrip(gl, shaderProgram, line[j], color);
            }

        }




        requestAnimationFrame(redraw);




    }

    requestAnimationFrame(redraw);





}


export {changeDropdown};