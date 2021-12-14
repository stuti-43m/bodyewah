let myVid; 
let poses = [];
let smoothPoints = [];
let p5lm;
let partnerFace = [];
let chaser = false;

function setup() {
  createCanvas(1200, 1000);
  p5lm = new p5LiveMedia(this, "DATA", null, "fly");
  p5lm.on('data', gotPartnerFace);
  // create an array of 17 keypoints
  for ( let i = 0; i < 17; i++) {
    smoothPoints.push(new Keypoint());
  }

  // create and hide webcam
  myVid = createCapture(VIDEO);
  myVid.size(width, height);
  myVid.hide();

  // posenet options 
  // use 'MobileNetV1' for slower computers
  const options = {
    flipHorizontal: true,
    architecture: 'ResNet50',
  }

  // create an instance of posenet, call modelLoaded on model load
  const poseNet = ml5.poseNet(myVid, options, modelLoaded);

  // everytime we receive a pose, call gotPoses 
  poseNet.on('pose', (results) => gotPoses(results));
}

function gotPartnerFace(data, id) {
  partnerFace = JSON.parse(data);
  if(partnerFace.start) {
    chaser = true;
  }
}


function modelLoaded() {
  console.log('loaded!');

}

function gotPoses(results) {
  // put the results in a global variable 
  poses = results;
}

function drawPose() {
  // poses[0].pose.keypoints[0].position.x

  // loop through the poses, there is one pose for each person detected
  for (let i =0; i < poses.length; i++) { 
    // get the keypoints from the detected pose
    const keypoints = poses[i].pose.keypoints;
    // loop throuh keypoints 
    for (let j = 0; j < keypoints.length; j++ ) { 
      const x = keypoints[j].position.x;
      const y = keypoints[j].position.y;

      // update the keypoints and smooth them
      smoothPoints[j].update(x,y);

      // draw the smoothed points 
      //fill('white');
      //ellipse(smoothPoints[j].x,smoothPoints[j].y,20);

    }
    //left eye
    let faceCenterX = smoothPoints[3].x+2;
    let faceCenterY = smoothPoints[3].y;
    //body start(leftshoulder)
    let bodyStartY = smoothPoints[6].y;
    let leftElbow = smoothPoints[2].y;
    //r cos a = leftElbo
    push()
      strokeWeight(7);
      stroke("#0b9994")
      //let a = ((poses[i].pose.rightShoulder.y-80) - (poses[i].pose.rightElbow.y))/((faceCenterX+20) - (faceCenterX+80));
      //let angle1 = atan(a);
      //rotate(-angle1);
      //ellipse(faceCenterX+20,poses[i].pose.rightShoulder.y,30,200)
      line(faceCenterX+120,poses[i].pose.rightShoulder.y-100,faceCenterX+200,poses[i].pose.rightElbow.y-150)
    pop()

    push()
      strokeWeight(7);
      stroke("#0b9994")
      line(faceCenterX-120,poses[i].pose.leftShoulder.y-100,faceCenterX-200,poses[i].pose.leftElbow.y-150)
    pop()

    push()
      noStroke()
      fill(255, 204, 100);
      ellipse(faceCenterX,bodyStartY,300,350);
    pop()

    push()
      noStroke()
      fill(255, 204, 2);
      ellipse(faceCenterX,faceCenterY,300,faceCenterY-bodyStartY);
    pop()
    
    drawPartner();
    //ellipse(faceCenterX+20,bodyStartY,40,200);
    p5lm.send(JSON.stringify({
      wingL:{
        x1:faceCenterX+120,
        y1:poses[i].pose.rightShoulder.y-100,
        x2:faceCenterX+200,
        y2:poses[i].pose.rightElbow.y-150
      },
      wingR:{
        x1:faceCenterX-120,
        y1:poses[i].pose.leftShoulder.y-100,
        x2:faceCenterX-200,
        y2:poses[i].pose.leftElbow.y-150
      },
      b1:{
        x1:faceCenterX,
        y1:bodyStartY
      },
      b2:{
        x1:faceCenterX,
        y1:faceCenterY,
        height:faceCenterY-bodyStartY
      }
    }));

  }
}
function drawPartner() {
  if(partnerFace.wingL) {
    push()
      strokeWeight(7);
      stroke("#1ab8b8")
      line(partnerFace.wingL.x1,partnerFace.wingL.y1,partnerFace.wingL.x2,partnerFace.wingL.y2)
    pop()
  }
  if(partnerFace.wingR) {
    push()
      strokeWeight(7);
      stroke("#1ab8b8")
      line(partnerFace.wingR.x1,partnerFace.wingR.y1,partnerFace.wingR.x2,partnerFace.wingR.y2)
    pop()
  }

  if(partnerFace.b1) {
    push()
      noStroke()
      fill("#e07b00");
      ellipse(partnerFace.b1.x1,partnerFace.b1.y1,300,350);
    pop()
  }

  if(partnerFace.b2) {
    push()
      noStroke()
      fill("#e3912d");
      ellipse(partnerFace.b2.x1,partnerFace.b2.y1,300,partnerFace.b2.height);
    pop()
  }
}
function draw() {
  background("#1f1f1e");

  // draw the image
  push();
  translate(width, 0);
  scale(-1,1);
  //image(myVid, 0,0,width, height);
  pop();

  // draw the keypoints 
  drawPose();
  //drawBird();
}

// a class to smooth the keypoints 
class Keypoint {

  constructor() {
    this.x = null;
    this.y = null;
    this.pastX = [];
    this.pastY = [];
    this.smoothAmount = 5; // set smoothing amount here 

  } 

  update(x,y) { 
    this.pastX.push(x);
    this.pastY.push(y);

    let xSum = 0;
    let ySum = 0;

    // add together all of the x / y values 
    for (let i = 0; i < this.pastX.length; i++) { 
      xSum+=this.pastX[i];
      ySum+=this.pastY[i];
    }

    // find the average smoothed x/y values 
    this.x = xSum / this.pastX.length;
    this.y = ySum / this.pastY.length;

    // remove old x values 
    if (this.pastX.length >= this.smoothAmount) { 
      this.pastX.shift();
    }

    // remove old y values
    if (this.pastY.length >= this.smoothAmount) { 
      this.pastY.shift();
    }

  }
}