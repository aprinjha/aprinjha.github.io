/**
 * @file A simple WebGL example drawing a triangle with colors
 * @author Aryan Prinjha <prinjha2@illinois.edu>
 * 
 * Updated Spring 2021 to use WebGL 2.0 and GLSL 3.00
 */

/** @global The WebGL context */
var gl;

/** @global The HTML5 canvas we draw on */
var canvas;

/** @global A simple GLSL shader program */
var shaderProgram;

/** @global The WebGL buffer holding the triangle */
var vertexPositionBuffer;

/** @global The WebGL buffer holding the vertex colors */
var vertexColorBuffer;

/** @global The vertex array object for the triangle */
var vertexArrayObject;

/** @global The rotation angle of our triangle */
var rotAngle = 0;

/** @global Scaling Factor for block I logo */
var scale = [0.5,0.5,0.5];

/** @global Scaling State, Switches between increasing and decreasing, that is -1 and +! */
var scaleState = 1;

/** @global Offset for all vertices for logo I */
var pointOffset = 0.01;

/** @global State of pointState increasing or decreasing*/
var pointState = 1;

/** @global The ModelView matrix contains any modeling and viewing transformations */
var modelViewMatrix = glMatrix.mat4.create();

/** @global Records time last frame was rendered */
var previousTime = 0;

/** @global Checking collision of Shuriken Star */
var curr_collision = 0;

/** @global Checking if Shuriken Star is going out of bound in x axis */
var xflag = 0;

/** @global Checking if Shuriken Star is going out of bound in y axis */
var yflag = 0;

/** @global Variable containing all the vertices of the I logo */
var triangleVertices = [
    -0.6, 0.8,0.0,
    -0.6, 0.4,0.0,
    -0.2, 0.8,0.0,
     
    -0.6, 0.4,0.0,
    -0.2, 0.8,0.0,
    -0.2, 0.4,0.0,
    
    -0.2, 0.8,0.0,
    -0.2, 0.4,0.0,
     0.2, 0.8,0.0,
    
    -0.2,0.4,0.0,
     0.2,0.8,0.0,
     0.2,0.4,0.0,
    
     0.2,0.8,0.0,
     0.2,0.4,0.0,
     0.6,0.8,0.0,
    
     0.2,0.4,0.0,
     0.6,0.8,0.0,
     0.6,0.4,0.0,
    
     -0.2, 0.4,0.0,
      0.2, 0.4,0.0,
     -0.2,-0.4,0.0,
    
      0.2, 0.4,0.0,
     -0.2,-0.4,0.0,
      0.2,-0.4,0.0,
    
     -0.2,-0.4,0.0,
      0.2,-0.4,0.0,
     -0.2,-0.8,0.0,
    
      0.2,-0.4,0.0,
     -0.2,-0.8,0.0,
      0.2,-0.8,0.0,
    
      0.2,-0.4,0.0,
      0.6,-0.8,0.0,
      0.2,-0.8,0.0,
     
      0.2,-0.4,0.0,
      0.6,-0.8,0.0,
      0.6,-0.4,0.0,
    
    -0.2,-0.4,0.0,
    -0.2,-0.8,0.0,
    -0.6,-0.8,0.0,
    
    -0.2,-0.4,0.0,
    -0.6,-0.8,0.0,
    -0.6,-0.4,0.0
            
];

/** @global Variable containing all the vertices of the Shuriken Star */
var shuriken =[
   0.0, 0.8, 0.0,
  -0.2, 0.2, 0.0,
   0.2, 0.2, 0.0,

   0.2, 0.2, 0.0,
   0.8, 0.0, 0.0,
   0.2,-0.2, 0.0,

   0.2,-0.2, 0.0,
   0.0,-0.8, 0.0,
  -0.2,-0.2, 0.0,

  -0.2,-0.2, 0.0,
  -0.8, 0.0, 0.0,
  -0.2, 0.2, 0.0,

  -0.2,-0.2, 0.0,
   0.2, 0.2, 0.0,
  -0.2, 0.2, 0.0,

  -0.2,-0.2, 0.0,
   0.2, 0.2, 0.0,
   0.2,-0.2, 0.0,

]


/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}


/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */
function createGLContext(canvas) {
  var context = null;
  context = canvas.getContext("webgl2");
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}


/**
 * Loads a shader.
 * Retrieves the source code from the HTML document and compiles it.
 * @param {string} id ID string for shader to load. Either vertex shader/fragment shader
 */
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
    
  var shaderSource = shaderScript.text;
 
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
 
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader;
}


/**
 * Set up the fragment and vertex shaders.
 */
function setupShaders() {
  // Compile the shaders' source code.
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");
  
  // Link the shaders together into a program.
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  // We only use one shader program for this example, so we can just bind
  // it as the current program here.
  gl.useProgram(shaderProgram);
    
  // Query the index of each attribute in the list of attributes maintained
  // by the GPU. 
  shaderProgram.vertexPositionAttribute =
    gl.getAttribLocation(shaderProgram, "aVertexPosition");
  shaderProgram.vertexColorAttribute =
    gl.getAttribLocation(shaderProgram, "aVertexColor");
    
  //Get the index of the Uniform variable as well
  shaderProgram.modelViewMatrixUniform =
    gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
}


/**
 * Set up the buffers to hold the triangle's vertex positions and colors.
 */
function setupBuffers() {
    
  // Create the vertex array object, which holds the list of attributes for
  // the triangle.
  vertexArrayObject = gl.createVertexArray();

  // Checking if I logo is selected
  if (document.getElementById("I").checked == true)
        {
        gl.bindVertexArray(vertexArrayObject); 

        // Create a buffer for positions, and bind it to the vertex array object.
        vertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);

        // Populate the buffer with the position data.
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
        vertexPositionBuffer.itemSize = 3;
        vertexPositionBuffer.numberOfItems = triangleVertices.length/3;

        // Binds the buffer that we just made to the vertex position attribute.
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                              vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
        
        // Do the same steps for the color buffer.
        vertexColorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
        
        // Array containing all the RGBA values for triangles
        var triangleColors = new Array();

        // Triangles assigning RGBA values to each vertex
        for ( i = 0 ; i < 42 ; i ++){
          triangleColors[0 + i*4] = 0.91;
          triangleColors[1 + i*4] = 0.29;
          triangleColors[2 + i*4] = 0.15;
          triangleColors[3 + i*4] = 1.00;
        }

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleColors), gl.STATIC_DRAW);
        vertexColorBuffer.itemSize = 4;

        //Dividing length by 4 as there are 4 parameters RGBA
        vertexColorBuffer.numItems = triangleColors.length/4;  
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                              vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
          
        // Enable each attribute we are using in the VAO.  
        gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
        gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
          
        // Unbind the vertex array object to be safe.
        gl.bindVertexArray(null);  
    }
    // My Logo is selected
    else{
        gl.bindVertexArray(vertexArrayObject); 

        // Create a buffer for positions, and bind it to the vertex array object.
        vertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);

        // Populate the buffer with the position data.
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shuriken), gl.STATIC_DRAW);
        vertexPositionBuffer.itemSize = 3;
        vertexPositionBuffer.numberOfItems = shuriken.length/3;

        // Binds the buffer that we just made to the vertex position attribute.
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                              vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
        
        // Do the same steps for the color buffer.
        vertexColorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
        
        // New variable array for   Shuriken Star
        var shurikenColors = new Array();
    
        //Checking if there has been a collision and randomizing side triangle colors to diamond like
        if(curr_collision == 1){
          for ( i = 0 ; i < 12 ; i ++){
            shurikenColors[0 + i*4] = Math.random() *255;//45;
            shurikenColors[1 + i*4] = Math.random() *255;//45;
            shurikenColors[2 + i*4] = Math.random() *255;//43;
            shurikenColors[3 + i*4] = 1.00;
          }
          //Setting middle square to solid color
          for ( i = 12 ; i < 18 ; i ++){
            shurikenColors[0 + i*4] = 45;
            shurikenColors[1 + i*4] = 45;
            shurikenColors[2 + i*4] = 43;
            shurikenColors[3 + i*4] = 1.00;
          }
        }

        //Solid color assign when collision again
        else{
          for ( i = 0 ; i < 18 ; i ++){
            shurikenColors[0 + i*4] = 184;
            shurikenColors[1 + i*4] = 146;
            shurikenColors[2 + i*4] = 106;
            shurikenColors[3 + i*4] = 1.00;
          }
        }

        //Dividing by 255 as RGB values are supposed to be in floating point
        for(i=0; i<72; i++){
          if(i%4 != 3)
            shurikenColors[i] = shurikenColors[i] / 255;
        }

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shurikenColors), gl.STATIC_DRAW);
        vertexColorBuffer.itemSize = 4;
        vertexColorBuffer.numItems = shurikenColors.length/4;  
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                              vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
          
        // Enable each attribute we are using in the VAO.  
        gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
        gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
          
        // Unbind the vertex array object to be safe.
        gl.bindVertexArray(null);
    }
        
}


/**
 * Draws a frame to the screen.
 */
function draw() {
  // Transform the clip coordinates so the render fills the canvas dimensions.
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

  // Clear the screen.
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Use the vertex array object that we set up.
  gl.bindVertexArray(vertexArrayObject);
    
  // Send the ModelView matrix with our transformations to the vertex shader.
  gl.uniformMatrix4fv(shaderProgram.modelViewMatrixUniform,
                      false, modelViewMatrix);
    
  // Render the triangle. 
  gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);
  
  // Unbind the vertex array object to be safe.
  gl.bindVertexArray(null);
}

/**
 * Revolves the I logo around the screen with x axis dependent on sin and y axis on cos
 */
function complexanimation_i(){
  
  pointOffset = pointOffset + pointState/100;
  if(pointOffset == 1)
    pointState = -1;
  else if (pointOffset == -1)
    pointState = 1;

  for ( i = 0 ; i < triangleVertices.length ; i++ ){
      if(i%3 == 0){
        triangleVertices[i] = triangleVertices[i] + pointState*Math.sin(pointOffset)/100;
      }
      if(i%3 == 1){
        triangleVertices[i] = triangleVertices[i] + pointState*Math.cos(pointOffset)/150;
      }
  }

  // Using Dynamic Draw 
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.DYNAMIC_DRAW);
}

/** @global Sign -1 or +1 for x axis random traversal */
var sign = Math.random() <0.5 ? -1 : 1 ;

/** @global Sign -1 or +1 for y axis random traversal */
var sign2 = Math.random() <0.5 ? -1 : 1 ;

/** @global Random x axis traversal weight */
var random1 = sign * 0.4/50 ;

/** @global Random x axis traversal weight */
var random2 = sign2 * 0.6/50 ;

/**
 * Function moves the Shuriken Star across the board like an old DVD logo.
 * As it collides with a wall, it changes direction as well as color
 */
function complexanimation_shuriken(){
  // Setting collision x axis check
  var detectx = 0;

  //Setting collision y axis check
  var detecty = 0;

  for(i = 0 ; i < shuriken.length; i++ ){
      if(i%3 == 0){
        var temp = shuriken[i] + random1;
        
        // Collision detected
        if(temp >=2 || temp <=-2)
          detectx = 1;
        
        // Collision Direction Check
        if(temp >=2)
          xflag = -1;
        if(temp <= -2)
          xflag = 1;
      }

      if(i%3 == 1){
        var temp = shuriken[i] + random2;
        
        // Collision detected
        if(temp>=2 || temp <=-2)
          detecty = 1;

        // Collision Direction Check  
        if(temp >=2)
          yflag = -1;
        if(temp <= -2)
          yflag = 1;
      }
  }

  // Changing direction if collision detected
  if(xflag == 1){
    sign = xflag;
    if(yflag = 0){
      sign2 *= -1;
    }
  }
  else if (xflag == -1){
    sign = xflag;
    if(yflag = 0){
      sign2 *= -1;
    }
  }

  if(yflag == 1){
    sign2 = yflag;
    if(xflag = 0){
      sign *= -1 ;
    }
  }
  else if (yflag == -1){
    sign2 = yflag;
    if(xflag = 0){
      sign *= -1 ;
    }
  }

  // Resetting the x and y flags
  xflag = 0;
  yflag = 0;

  // Setting Curr_collision for color change
  if(detectx == 1||detecty == 1){
    if(curr_collision == 1)
      curr_collision = 0;
    else
      curr_collision = 1;
  }

  //Recalculating x and y weights using new signs
  random1 = sign  * 0.4 /50 ;

  random2 = sign2 * 0.6 /50 ;

  //Editing the vertices in shuriken by adding newly calulated weights
  for ( i = 0 ; i < shuriken.length ; i++ ){
      if(i%3 == 0){
        shuriken[i] = shuriken[i] + random1;
      }
      if(i%3 == 1){
        shuriken[i] = shuriken[i] + random2;
      }
  }

  // Using Dynamic Draw
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.DYNAMIC_DRAW);
}

/**
 * Animates the triangle by updating the ModelView matrix with a rotation
 * each frame.
 */

 
 function animate(currentTime) {
  if (document.getElementById("I").checked == true){
    // Read the speed slider from the web page for Rotation Speed.
    var speed = 5 ;
    // document.getElementById("speed").value;
    // Read the speed slider from the web page for Scaling Speed.
    var speed1 = 5 ;
    // document.getElementById("speed1").value;

    // Convert the time to seconds.
    currentTime *= 0.001;
    // Subtract the previous time from the current time.
    var deltaTime = currentTime - previousTime;
    // Remember the current time for the next frame.
    previousTime = currentTime;
      
    // Update geometry to rotate 'speed' degrees per second.
    rotAngle += (speed * deltaTime)/2;
    
    if (rotAngle > 360.0)
        rotAngle = 0.0;
    
    // Resetting scales and changing increment/decrement state 
    if(scale[0] > 0.6){
        scaleState = -1;
        scale[0] = 0.6;
        scale[1] = 0.6;
        scale[2] = 0.6;
    }

    // Resetting scales and changing increment/decrement state 
    if(scale[0] <0.3){
        scaleState = 1 ;
        scale[0] = 0.3;
        scale[1] = 0.3;
        scale[2] = 0.3;
    }

    // Updating scales for x,y,z
    scale[0] += scaleState * speed1 * deltaTime /100 ;
    scale[1] += scaleState * speed1 * deltaTime /100 ;
    scale[2] += scaleState * speed1 * deltaTime /100 ;
    
    
    
    // Z Rotation and scaling for Block I logo 
    
    glMatrix.mat4.identity(modelViewMatrix);
    glMatrix.mat4.fromZRotation(modelViewMatrix, degToRad(rotAngle/10));
    glMatrix.mat4.scale(modelViewMatrix, modelViewMatrix, scale);
    glMatrix.mat4.translate(modelViewMatrix,modelViewMatrix,[-1.0,0.0,0.0]);
    
    // Calling I traversal within box using sin waves on x and cos waves on y axis
    complexanimation_i();
    setupBuffers(); 
    
    // Draw the frame.
    draw();
    
    // Animate the next frame. The animate function is passed the current time in
    // milliseconds.
    requestAnimationFrame(animate);
  }
  else{
    
    
    glMatrix.mat4.identity(modelViewMatrix);
    glMatrix.mat4.scale(modelViewMatrix, modelViewMatrix, [0.5,0.5,0.5]);
    
    // Calling Shuriken Collision Detection
    complexanimation_shuriken();

    // Setting up the buffers
    setupBuffers(); 
    
    // Draw the frame.
    draw();
    
    // Animate the next frame. The animate function is passed the current time in
    // milliseconds.
    requestAnimationFrame(animate);
  }
}


/**
 * Startup function called from html code to start the program.
 */
 function startup() {
  console.log("Starting animation...");
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders(); 
  setupBuffers();
  if (document.getElementById("I").checked == true)
    // Background color 
    gl.clearColor(0.074, 0.1607, 0.294, 1.0);

  requestAnimationFrame(animate); 
}

