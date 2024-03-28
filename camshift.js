
if (!window.ImageProcessors) {
  window.ImageProcessors = {};
}
window.ImageProcessors.CamShift = function camShift() {
  let video = document.getElementById('videoInput');
  let cap = new cv.VideoCapture(video);
  let frame = new cv.Mat(video.height, video.width, cv.CV_8UC4);
  cap.read(frame);
  console.log(frame);
  let trackWindow = new cv.Rect(
    40,
    70,
    200,
    100
  ); //*
  console.log(trackWindow);

  let roi = frame.roi(trackWindow);
  let hsvRoi = new cv.Mat();

  cv.cvtColor(roi, hsvRoi, cv.COLOR_RGBA2RGB);
  cv.cvtColor(hsvRoi, hsvRoi, cv.COLOR_RGB2HSV);

  let mask = new cv.Mat(); //*
  let lowScalar = new cv.Scalar(30, 30, 0);//*
  let highScalar = new cv.Scalar(180, 180, 180);//*
  
  let low = new cv.Mat(hsvRoi.rows, hsvRoi.cols, hsvRoi.type(), lowScalar);//*
  let high = new cv.Mat(hsvRoi.rows, hsvRoi.cols, hsvRoi.type(), highScalar);//*

  cv.inRange(hsvRoi, low, high, mask);

  let roiHist = new cv.Mat();
  let hsvRoiVec = new cv.MatVector();
  hsvRoiVec.push_back(hsvRoi);
  cv.calcHist(hsvRoiVec, [0], mask, roiHist, [180], [0, 180]);
  cv.normalize(roiHist, roiHist, 0, 255, cv.NORM_MINMAX);
  roi.delete(); hsvRoi.delete(); mask.delete(); low.delete(); high.delete(); hsvRoiVec.delete();
  // Setup the termination criteria, either 10 iteration or move by atleast 1 pt
  let termCrit = new cv.TermCriteria(cv.TERM_CRITERIA_EPS | cv.TERM_CRITERIA_COUNT, 10, 1);
  let hsv = new cv.Mat(video.height, video.width, cv.CV_8UC3);
  let hsvVec = new cv.MatVector();
  hsvVec.push_back(hsv);
  let dst = new cv.Mat();
  let trackBox = null;
  const FPS = 100;
  function processVideo() {
    try {
      if (!streaming) {
        // clean and stop.
        frame.delete(); dst.delete(); hsvVec.delete(); roiHist.delete(); hsv.delete();
        return;
      }
      let begin = Date.now();
      // start processing.
      cap.read(frame);
      cv.cvtColor(frame, hsv, cv.COLOR_RGBA2RGB);
      cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);
      
      cv.calcBackProject(hsvVec, [0], roiHist, dst, [0, 180], 1);
      [trackBox, trackWindow] = cv.CamShift(dst, trackWindow, termCrit);
      let pts = cv.rotatedRectPoints(trackBox);
      cv.line(frame, pts[0], pts[1], [255, 0, 0, 255], 3);
      cv.line(frame, pts[1], pts[2], [255, 0, 0, 255], 3);
      cv.line(frame, pts[2], pts[3], [255, 0, 0, 255], 3);
      cv.line(frame, pts[3], pts[0], [255, 0, 0, 255], 3);
      cv.imshow('canvasOutput', frame);
      let delay = 1000 / FPS - (Date.now() - begin);
      setTimeout(processVideo, 100);
    } catch (err) {
      utils.printError(err);
    }
  };
  setTimeout(processVideo, 0);

}