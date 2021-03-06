/*
*ThxCard is a canvas-based thanks card for wedding or other party.
*It allows the user to modify and get is own customised thanx card.
*He can choose different background and different embedded photo of the event.
*
*/

// START WRAPPER: The YUI.add wrapper is added by the build system, when you use YUI Builder to build your component from the raw source in this file
// YUI.add("mywidget", function(Y) {
YUI().use('base', 'widget', 'node', 'substitute', 'console' ,'event', 'event-mousewheel', 'array-extras', function(Y) {
  /* Any frequently used shortcuts, strings and constants */
  var Lang = Y.Lang,
  Widget = Y.Widget,
  Node = Y.Node;

  /** ThanksCard class constructor
  *@class ThanksCard
  *@constructor
  *
  * */
  function ThanksCard(config) {
    ThanksCard.superclass.constructor.apply(this, arguments);
  }

  /* 
  * Required NAME static field, to identify the Widget class and 
  * used as an event prefix, to generate class names etc. (set to the 
  * class name in camel case). 
  */
  ThanksCard.NAME = "thanksCard";

  /*
  * The attribute configuration for the widget. This defines the core user facing state of the widget
  */
  ThanksCard.ATTRS = {

    currentBG : {
      value: 0  
    },

    /*a list of current frames images.
    * default should be [0]
    *  if undefined should return 0
    */
    currentFrameImgs : {
      value: [0]
    },

    //list of images ratio. default is 1
    imgsRatio : {
      value: [1]
    },
    //the image frame that will be modified with a nextImg
    selectedFrame : {
      value: 0
    },

    bgRatio : {
      value : 1
    },

    //the list of background images
    listOfBGs : {
      value : [
        /*   [{
          *    name: 'test1',
          *node: Y.one('#bg_img1'),
          *    coord: [{x:525, y:250, width:595, height: 600, angle:0.261},
          *    {x:1249, y:240, width:595, height: 525, angle:0.174}]
          *  }]
          */  
          //}
      ]
    },

    //the list of images
    listOfImgs : {
      value : [[
        //{name: 'test',
          //node: srcNode
          //}
      ]],
      setter: function(val, valName) { 
        Y.log('Setting ' + valName + ' to ' + val);
        return this.setAllListsOfImg(val); }
    },

    ctx : {
      writeOnce: true,
      readOnly: true
    },

//canvas width, initial value is max value
    width : {
      //value : 1772,
      value: 1000,
      writeOnce: false
    },
//canvas height, initial value is max value
    height : {
      //value : 1181,
      value: 667,
      writeOnce: false
    }


    // ... attrB, attrC, attrD ... attribute configurations. 

    // Can also include attributes for the super class if you want to override or add configuration parameters
  };

  /* 
  * The HTML_PARSER static constant is used if the Widget supports progressive enhancement, and is
  * used to populate the configuration for the ThanksCard instance from markup already on the page.
  */
  ThanksCard.HTML_PARSER = {

    //listOfBGs: function (srcNode) {
      // If progressive enhancement is to be supported, return the value of "currentBG" based on the contents of the srcNode
      //      srcNode.one('img')

      //}

  };

  /* Templates for any markup the widget uses. Usually includes {} tokens, which are replaced through Y.substitute */
  ThanksCard.MYNODE_TEMPLATE = "<canvas id={mynodeid}></canvas>";

  /* ThanksCard extends the base Widget class */
  Y.extend(ThanksCard, Y.Widget, {

    initializer: function() {
      /*
      * initializer is part of the lifecycle introduced by 
      * the Base class. It is invoked during construction,
      * and can be used to setup instance specific state or publish events which
      * require special configuration (if they don't need custom configuration, 
      * events are published lazily only if there are subscribers).
      *
      * It does not need to invoke the superclass initializer. 
      * init(zer() for all classes in the hierarchy.
      */



      this.publish("myEvent", {
        defaultFn: this._defMyEventFn,
        bubbles:false
      });
    },

    destructor : function() {
      /*
      * destructor is part of the lifecycle introduced by 
      * the Widget class. It is invoked during destruction,
      * and can be used to cleanup instance specific state.
      *
      * Anything under the boundingBox will be cleaned up by the Widget base class
      * We only need to clean up nodes/events attached outside of the bounding Box
      *
      * It does not need to invoke the superclass destructor. 
      * destroy() will call initializer() for all classes in the hierarchy.
      */
    },

    renderUI : function() {
      /*
      * renderUI is part of the lifecycle introduced by the
      * Widget class. Widget's renderer method invokes:
      *
      *     renderUI()
      *     bindUI()
      *     syncUI()
      *
      * renderUI is intended to be used by the Widget subclass
      * to create or insert new elements into the DOM. 
      */

      var contentBox = this.get("contentBox"),
      body = Y.one('body'),
      winWidth = body.get('winWidth'),
      winHeight  = body.get('winHeight'),
      initialWidth = this.get('width'),
      initialHeight = this.get('height');
      
      winWidth = Math.min(winWidth, initialWidth);
      winHeight = Math.min(winHeight, initialHeight);
      
      this._mynode = Node.create(Y.substitute(ThanksCard.MYNODE_TEMPLATE, {mynodeid: this.get("id") + "_mynode"})); 
      //this._mynode.setAttribute('width', this.get('width')+'px');
      //this._mynode.setAttribute('height', this.get('height')+'px');
      this._mynode.setAttribute('width', winWidth);
      this._mynode.setAttribute('height', winHeight );
      this._set('ctx', this._mynode.getDOMNode().getContext('2d'));
      //TODO insert the node
      this.set('width', winWidth);
      this.set('height', winHeight);

      contentBox.appendChild(this._mynode);

    },

    bindUI : function() {
      /*
      * bindUI is intended to be used by the Widget subclass 
      * to bind any event listeners which will drive the Widget UI.
      * 
      * It will generally bind event listeners for attribute change
      * events, to update the state of the rendered UI in response 
      * to attribute value changes, and also attach any DOM events,
      * to activate the UI.
      */

      Y.log('bind UI event');
      this.after("currentBGChange", this._afterCurrentBGChange);
      this.after("currentFrameImgsChange", this._afterCurrentFrameImgsChange);
      this.after("imgsRatioChange", this._afterImgsRatioChange);
    },

    syncUI : function() {
      /*
      * syncUI is intended to be used by the Widget subclass to
      * update the UI to reflect the initial state of the widget,
      * after renderUI. From there, the event listeners we bound above
      * will take over.
      */

      // set default background, and default embedded photo and text
      this._uiSetCurrentBG(this.get("currentBG"));
    },

    // Beyond this point is the ThanksCard specific application and rendering logic

    /* Attribute state supporting methods (see attribute config above) */
    _afterCurrentBGChange : function(e) {
      /* Listens for changes in state, and asks for a UI update (controller). */

      this._uiSetCurrentBG(e.newVal);
    },

    _uiSetCurrentBG : function(currentBGIndex) {
      /* Update the state of currentBG in the UI (view) */
      //this._drawScene(imgIndex, this.get('currentBG'), this.get('currentFrameImgs')); 
      this._drawScene(currentBGIndex,  this.get('currentFrameImgs')); 
    },

    _afterCurrentFrameImgsChange : function(e) {
      /* Listens for changes in state, and asks for a UI update (controller). */

      this._uiSetCurrentFrameImgs(e.newVal);
    },

    _uiSetCurrentFrameImgs : function(imgIndex) {
      /* Update the state of currentBG in the UI (view) */
      this._drawScene( this.get('currentBG'), this.get('currentFrameImgs')); 
    },


    _afterImgsRatioChange : function(e) {
      Y.log('after ImgsRatio change');
      this._uiSetImgsRatioChange(e.newVal);
    },

    _uiSetImgsRatioChange : function(imgIndex) {
      this._drawScene( this.get('currentBG'), this.get('currentFrameImgs')); 
    },

    /**
    *setter for listsOfImg
    */
    setAllListsOfImg : function(classesList){
      var res = [];
      Y.Array.each(classesList, function(it, i) {
        res.push(this.setListOfImg(it, i));
      }, this);
      return res;
    },

    /**
    *set List of img for frame number argName
    * @method setLIstOfImg
    *
    * @param argName index of frame the list of img is for
    * @param elClass class of images to put in that list
    *
    */
    setListOfImg : function (elClass, argName) {
      var imgs = Y.all(elClass);
      Y.log('Setting images for ' + argName);
      var listOfImgs = [];
      imgs.each(function (item) {
        this.push({
          node: item, 
          name: item.get('name') || 'NoName'
        });
      }, listOfImgs);
      if (Y.Lang.isNumber(argName)){
        var tmp = this.get('listOfImgs') || [];
        tmp[argName] = listOfImgs;
      }
      return listOfImgs; 
    },




    /*
    *Draw the background.
    *Make it fit in the viewport
    */

    _drawBG : function (img) {
      var ctx = this.get('ctx'),
      width = img.width,
      height = img.height,
      ratio = this.get('bgRatio');
      ctx.drawImage(img, 0, 0, width * ratio, height * ratio );
      ctx.save();
      ctx.scale(ratio,ratio);
      ctx.drawImage(img, 0, 0);
      ctx.restore();
    },

    /**
    *Draw the whole canvas with bg, primary and secondary img
    * whose index is passed as arg
    */
    _drawScene : function (bgIndex, imgsIndex){
      Y.log('_drawScene: ' + bgIndex + ', ' + imgsIndex);
      var img = this.get('listOfBGs')[bgIndex];

      var imgName = img.name;
      img = img.node.getDOMNode(),
      ratio = this.computeRatio(img.width, img.height, this.get('width'), this.get('height'));
      this.set('bgRatio', ratio);
      this._drawWhiteBlank();
      var bgInfo = this.get('listOfBGs')[bgIndex];

      //for each frame, draw the corresponding current img
      Y.Array.each(bgInfo.coord, function(coord, frameNumber) {
        var imgIndex = imgsIndex[frameNumber] || 0;
        var img = this.get('listOfImgs')[frameNumber][imgIndex];
        this._drawImage(img, frameNumber);
      }, this);
      this._drawBG(img);

    },


    /**
    *Draw the whole canvas with bg, primary and secondary img
    * whose index is passed as arg
    */
    _drawSceneOld : function (bgIndex, primImgIndex, secImgIndex){
      Y.log('_drawScene: ' + bgIndex + ', ' + primImgIndex + ', ' + secImgIndex);
      var img = this.get('listOfBGs')[bgIndex];

      var imgName = img.name;
      img = img.node.getDOMNode(),
      ratio = this.computeRatio(img.width, img.height, this.get('width'), this.get('height'));
      this.set('bgRatio', ratio);

      this._drawWhiteBlank();
      this._drawImage(this.get('listOfPrimImgs')[primImgIndex], 0);
      this._drawImage(this.get('listOfSecImgs')[secImgIndex], 1);
      this._drawBG(img);

    },

    /*
    *erase the whole canvas
    */
    _drawWhiteBlank: function() {
      var ctx = this.get('ctx');
      Y.log('drawWithBlank');
      ctx.clearRect(0, 0, this.get('width') , this.get('height') );

    },

    /**
    *draw an image, at the position and angle 
    * specified by the BG information
    */
    _drawImage : function (img, frameNumber) {
      var ctx = this.get('ctx'),
      ratio = this.get('bgRatio'),
      bgIndex = this.get('currentBG'),
      bg=this.get('listOfBGs')[bgIndex],
      frameNumber = frameNumber || 0;

      var transX = bg.coord[frameNumber].x,
      transY = bg.coord[frameNumber].y,
      photoframe_width = bg.coord[frameNumber].width,
      photoframe_height = bg.coord[frameNumber].height,
      img = img.node.getDOMNode(), 
      angle = bg.coord[frameNumber].angle;
      //setup the context, 
      //scale according to the bg scale
      //translate to the photo frame position
      //and rotate like the photo frame
      //finally we clip to the size of thphoto frame
      ctx.save();
      ctx.scale(ratio, ratio);
      ctx.translate(transX, transY);
      ctx.rotate(angle);

      ctx.beginPath();
      ctx.lineTo(photoframe_width, 0);
      ctx.lineTo(photoframe_width, photoframe_height);
      ctx.lineTo(0, photoframe_height);
      ctx.lineTo(0, 0);
      ctx.clip();

      ratio = this.computeRatio(img.width, img.height, photoframe_width, photoframe_height);
      var framesRatio = this.get('imgsRatio'),
      frameR = framesRatio[frameNumber];
      if (Y.Lang.isUndefined(frameR)){
        frameR = 1;
        framesRatio[frameNumber] = frameR;
        this.set('imgsRatio', framesRatio);
      }
      ratio = ratio * frameR;
      ctx.scale(ratio, ratio);
      ctx.drawImage(img, 0, 0);
      ctx.restore(); 
    },
    /**
    *draw an image, at the position and angle 
    * specified by the BG information
    */
    _drawImageOld : function (img, frameNumber) {
      var ctx = this.get('ctx'),
      ratio = this.get('bgRatio'),
      bgIndex = this.get('currentBG'),
      bg=this.get('listOfBGs')[bgIndex],
      frameNumber = frameNumber || 0;

      var frameName = ['prim', 'sec'][frameNumber],
      coord = frameName + 'Coord', 
      ratioName = frameName + 'ImgRatio',
      transX = bg[coord].x,
      transY = bg[coord].y,
      photoframe_width = bg[coord].width,
      photoframe_height = bg[coord].height,
      img = img.node.getDOMNode(), 
      angle = bg[coord].angle;
      //setup the context, 
      //scale according to the bg scale
      //translate to the photo frame position
      //and rotate like the photo frame
      //finally we clip to the size of thphoto frame
      ctx.save();
      ctx.scale(ratio, ratio);
      ctx.translate(transX, transY);
      ctx.rotate(angle);

      ctx.beginPath();
      ctx.lineTo(photoframe_width, 0);
      ctx.lineTo(photoframe_width, photoframe_height);
      ctx.lineTo(0, photoframe_height);
      ctx.lineTo(0, 0);
      ctx.clip();

      ratio = this.computeRatio(img.width, img.height, photoframe_width, photoframe_height);
      ratio = ratio * this.get(ratioName);
      ctx.scale(ratio, ratio);
      ctx.drawImage(img, 0, 0);
      ctx.restore(); 
    },

    computeRatio : function (x,y,xref,yref){
      Y.log('computeRatio ' + x + ',' + y +', ' + xref + ', ' + yref);
      var xRatio = xref / x,
      yRatio = yref / y,
      ratio = 1;


      if (xRatio < 1 || yRatio < 1) {
        //we need to reduce size of img
        ratio = (xRatio < yRatio)? xRatio : yRatio; 
      } 
      return ratio;

    },

    nextBG : function() {

      var nextBG = this.get('currentBG') + 1;
      if (nextBG >= this.get('listOfBGs').length){
        nextBG = 0;
      }
      this.set('currentBG', nextBG);
      this.set('selectedFrame', 0);
      Y.log('New BG is ' + nextBG);

    },

    nextCurrentFrameImg : function() {

      var selectedFrame = this.get('selectedFrame');
      var currentFrameImgs =  this.get('currentFrameImgs'),
      currentFrameImg = currentFrameImgs[selectedFrame];
      if (Y.Lang.isUndefined(currentFrameImg)) {
        currentFrameImg = 1;
      } else {
        currentFrameImg ++;
      } 
      if (currentFrameImg >= this.get('listOfImgs')[selectedFrame].length){
        currentFrameImg = 0;
      }
      currentFrameImgs[selectedFrame] = currentFrameImg;
      this.set('currentFrameImgs', currentFrameImgs);
      Y.log('New Img for frame ' + selectedFrame +' is ' + currentFrameImg);
    },

    /*
    *switch between the frames 0 and 1
    */
    nextFrame : function() {
      var prev = this.get('selectedFrame');
      var currentBG = this.get('currentBG') ;
      var numberOfFrameInBG = this.get('listOfBGs')[currentBG].coord.length;
      this.set('selectedFrame', ((prev + 1 < numberOfFrameInBG )?prev+1:0)); 
      Y.log('Next Frame: ' + this.get('selectedFrame'));
    },


    primImgZoomHandler : function(scrollEvt){
      var delta = 0.01 *scrollEvt.wheelDelta,
      ratio = this.get('primImgRatio');
      Y.log('new primImgRatio = ' + ratio);
      this.set('primImgRatio', ratio+delta);
    },


    secImgZoomHandler : function(scrollEvt){
      var delta = 0.01 *scrollEvt.wheelDelta,
      ratio = this.get('secImgRatio');
      Y.log('new secImgRatio = ' + ratio);
      this.set('secImgRatio', ratio+delta);
    },

    selectedFrameZoomHandler : function(evt) {
      [this.primImgZoomHandler ,this.secImgZoomHandler][this.get('selectedFrame')].call(this, evt);
    },

    /**
    *Find what element of the thanks card the click was.
    * It can be the background, an image frame or other
    * In case it is an image frame the index of the frame will be returned too
    *
    *@method getElementClicked
    *@param {number} x x coordinate of the mouse click
    *@param {number} y y coordinate of the mouse click
    */
    getElementClicked: function(x, y) {
      Y.log('Finding what element was clicked on x' + x + '/y' + y);
      var framesCoords = this.get('listOfBGs')[this.get('currentBG')].coord;
      var clickedFrameIndex = (Y.Array.map(framesCoords, isInFrame, {x: x, y: y, that:this})).indexOf(true);
      

      function isInFrame(coord, index, a ) {
        var that = this.that,
        ctx = that.get('ctx'),
        ratio = that.get('bgRatio'),
        transX = coord.x,
        transY = coord.y,
        photoframe_width = coord.width,
        photoframe_height = coord.height,
        angle = coord.angle;
        //setup the context, 
        //scale according to the bg scale
        //translate to the photo frame position
        //and rotate like the photo frame
        //finally we clip to the size of thphoto frame
        ctx.save();
        ctx.scale(ratio, ratio);
        ctx.translate(transX, transY);
        ctx.rotate(angle);

        ctx.beginPath();
        ctx.lineTo(photoframe_width, 0);
        ctx.lineTo(photoframe_width, photoframe_height);
        ctx.lineTo(0, photoframe_height);
        ctx.lineTo(0, 0);
        ctx.stroke();
        ctx.restore();
        var isInPath = ctx.isPointInPath(this.x, this.y)
        Y.log('Point is in frame ' + index + ' : ' + isInPath); 
        return isInPath;
      }
      return clickedFrameIndex;
    },

    onClick: function(e) {
      var container = this.get('srcNode'),
      x = e.pageX - container.getX(),
      y = e.pageY - container.getY();

      var elClick = this.getElementClicked(x,y);
      if (elClick < 0) {
       this.nextBG();
      } else {
       this.set('selectedFrame', elClick);
       this.nextCurrentFrameImg();
      }
    }

  });

  Y.namespace("Thx").ThanksCard = ThanksCard;

  // }, "3.2.0", {requires:["widget", "substitute"]});
  // END WRAPPER


  Y.on('domready', function(){
    //we hide the 'waiting' element and show the thx_card container
    Y.one('#waiting').addClass('hidden');
    Y.one('#container').removeClass('hidden');
    var thx = new ThanksCard({
      srcNode: "#container",
      listOfBGs :[
        {
          name: 'test1',
          node: Y.one('#bg_img2'),
          coord: [{x:525, y:250, width:595, height: 600, angle:0.261},
          {x:1251, y:213, width:595, height: 525, angle:0.174}]
        },
        {
          name: 'test2',
          node: Y.one('#bg_img1'),
          coord: [{x:210, y:305, width:320, height: 310, angle:0},
          {x:1185, y:448, width:470, height: 475, angle:0}]
        }]
    });


    Y.log('Thx card inited\nset list of imgs...');
    var photoClasses = ['.primPhoto', '.secPhoto'];
    thx.set('listOfImgs', photoClasses);
    thx.render();
    Y.one('body').on('key', function (e) {
      thx.nextFrame();
    }, 'down:enter');

    Y.one('body').on('key', function (e) {
      e.preventDefault();
      thx.nextCurrentFrameImg();
    }, 'down:tab');

    Y.one('body').on('key', function (e) { 
      thx.nextBG();
      e.stopPropagation();
    }, 'down:+shift');
    Y.one('body').on('mousewheel', function (e) { 
      Y.log('event mousewheel'); 
      thx.selectedFrameZoomHandler(e);
    });

    Y.one('#container').on('click', thx.onClick, thx)

    Y.one('body').focus();


  });
});
