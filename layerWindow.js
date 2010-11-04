/*
 * layerWindow class
 *
 * layerWindow method: constructor
 *   Syntax
 *      var myLayerWindowInstance = new layerWindow([options]);
 *   Arguments 
 *	1. options - (object, optional) The options object.
 *   Options
 *	- id (string: default to null) The id attribute of the window container
 *	- bodyId (string: default to null) The id attribute of the body container
 *   	- title (string: default to null) The window title
 * 	- width (int: default to 400) The width in px of the window body
 * 	- height (int: default to null) The height in px of the body. By default its value depends on contained text
 *  	- minWidth (int: default to 300) The minimum width when resizing
 *	- minHeight (int: default to 100) The minimum height when resizing
 * 	- maxHeight (int: default to null) The max-height css property of the window body
 *	- draggable (bool: default to true) Whether or not to make the window draggable
 *	- resize (bool: default to true) Whether or not to make the window resizable
 *	- closeButtonUrl (string: default to null) The url of the image to use as close button
 *	- closeButtonLabel (string: default to close) The string to use as close button if the closeButtonUrl is null
 *	- destroyOnClose (bool: default to true) Whether or not to destroy all object properties when closing the window
 *  	- url (string: default to null) The url to be called by ajax request to get initial window body content
 *	- htmlNode (mixed: default to null) The html node which content is injected into the window body. May be a node element or its id.
 *	- html (string: default to null) The initial html content of the window body if url is null
 *	- closeCallback (function: default to null) The function to be called when the window is closed
 *	- closeCallbackParam (mixed: default to null) The paramether to pass to the callback function when the window is closed
 *	- disableObjects (bool: default to false) Whether or not to hide objects when window is showed (and show them when window is closed)
 *
 * layerWindow method: setTitle
 *  sets the title of the window and updates it if the window is showed
 *   Syntax
 *	myLayerWindowInstance.setTitle(title);
 *   Arguments
 *	1. title - (string) The title of the window
 *
 * layerWindow method: setHtml
 *  sets the content of the window and updates it if the window is showed
 *   Syntax
 *	myLayerWindowInstance.setHtml(html);
 *   Arguments
 *	1. html - (string) The html content of the window body
 *
 * layerWindow method: setUrl
 *  sets the content of the window and updates it if the window is showed
 *   Syntax
 *	myLayerWindowInstance.setUrl(url);
 *   Arguments
 *	1. url - (string) The url called by ajax request to get window body content
 *
 * layerWindow method: display
 *  displays the window in the position pointed by the element passed, or by the given coordinates
 *   Syntax
 *	myLayerWindowInstance.display(el, [opt]);
 *   Arguments
 *	1. el - (element) The element respect to which is rendered the window (top left of the window coincide with top left of the element)
 *      2. opt - (object) The top and left coordinates of the top left edge of the window. If only one is given the other is taken from the el passed
 *
 * layerWindow method: setFocus
 *  set focus on the object window, giving it the greatest z-index in the document
 *   Syntax
 *	myLayerWindowInstance.setFocus();
 *
 * layerWindow method: closeWindow
 *  closes the window and destroyes the object properties if the option destroyOnClose is true
 *   Syntax
 *	myLayerWindowInstance.closeWindow();
 *
 * layerWindow method: getViewport
 *  returns viewport properties (width, height, top, left, center-left, center-top)
 *   Syntax
 *	myLayerWindowInstance.getViewport();
 *  
 * layerWindow method: getMaxZindex
 *  returns the max z-index value present in the document
 *   Syntax
 *	myLayerWindowInstance.getMaxZindex();
 *
 */
var layerWindow = new Class({

	Implements: [Options, Chain],
	options: {
		id: null,
		bodyId: null,
		title: null,
		width: 400,
		height: null,
		minWidth: 300,
		minHeight: 100,
		maxHeight: null,
		draggable: true,
		resize: true,
		closeButtonUrl: null,
		closeButtonLabel: 'close',
		destroyOnClose: true,
		url:'',
		html: ' ',
		htmlNode: null,
		closeCallback: null,
		closeCallbackParam: null,
		disableObjects: false
	},
    	initialize: function(options) {
	
		this.showing = false;	

		if($defined(options)) this.setOptions(options);
		this.checkOptions();

		if($chk(this.options.title)) this.title = this.options.title;
		if($chk(this.options.html)) this.html = this.options.html;
		if($chk(this.options.htmlNode)) this.htmlNode = $type(this.options.htmlNode)=='element' ? this.options.htmlNode : $(this.options.htmlNode);
		if($chk(this.options.url)) this.url = this.options.url;

		this.maxZindex = this.getMaxZindex();

	},
	checkOptions: function() {
		var rexp = /[0-9]+/;
		if(!rexp.test(this.options.width) || this.options.width<this.options.minWidth) this.options.width = 400;
	},
	setTitle: function(title) {
		this.title = title;	 
		if(this.showing) this.header.set('html', title);
	},
	setHtml: function(html) {
		this.html = html;	 
		if(this.showing) this.body.set('html', html);
	},
	setUrl: function(url) {
		this.url = url;	 
		if(this.showing) this.request();
	},
	display: function(element, opt) {
		if(this.options.disableObjects) this.dObjects();
		this.showing = true;
		this.element = !element ? null : $type(element)=='element'? element:$(element);
		var elementCoord = $chk(this.element) ? this.element.getCoordinates() : null;
		this.top = (opt && $chk(opt.top)) ? opt.top < 0 ? 0 : opt.top : elementCoord ? elementCoord.top : (this.getViewport().cY-(this.options.height/2));
		this.left = (opt && $chk(opt.left)) ? opt.left < 0 ? 0 : opt.left : elementCoord ? elementCoord.left : (this.getViewport.cX-(this.options.width/2));
		this.renderContainer();
		this.renderHeader();
		this.renderBody();
		this.renderFooter();
		this.container.setStyle('width', (this.body.getCoordinates().width)+'px');
		this.initBodyHeight = this.body.getStyle('height').toInt();
		this.initContainerDim = this.container.getCoordinates();

		if(this.options.draggable) this.makeDraggable();
		if(this.options.resize) this.makeResizable();

	},
	dObjects: function() {
		for(var i=0;i<window.frames.length;i++) {
			var myFrame = window.frames[i];
			var obs = myFrame.document.getElementsByTagName('object');
			for(var ii=0; ii<obs.length; ii++) {
				obs[ii].style.visibility='hidden';
			}
		}
		$$('object').each(function(item) {
			item.style.visibility='hidden';
		})
	},
	eObjects: function() {
		for(var i=0;i<window.frames.length;i++) {
			var myFrame = window.frames[i];
			var obs = myFrame.document.getElementsByTagName('object');
			for(var ii=0; ii<obs.length; ii++) {
				obs[ii].style.visibility='visible';
			}
		}
		$$('object').each(function(item) {
			item.style.visibility='visible';
		})
	},
	renderContainer: function() {
		this.container = new Element('div', {'id':this.options.id, 'class':'abiWin'});

		this.container.setStyles({
			'top': this.top+'px',
			'left':this.left+'px'
		})
		this.setFocus();
		this.container.addEvent('mousedown', this.setFocus.bind(this));
		this.container.inject(document.body);
	},
	renderHeader: function() {
		this.header = new Element('header', {'class':'abiHeader'});
		this.header.set('html', this.title);

		var closeEl;
		if($chk(this.options.closeButtonUrl) && $type(this.options.closeButtonUrl)=='string') {
			closeEl = new Element('img', {'src':this.options.closeButtonUrl, 'class':'close'});
		}
		else {
			closeEl = new Element('span', {'class':'close'});
			closeEl.set('html', this.options.closeButtonLabel);
		}

		closeEl.addEvent('click', this.closeWindow.bind(this));
		this.header.inject(this.container, 'top');
		closeEl.inject(this.header, 'before');
    				
	},
	renderBody: function() {
		this.body = new Element('div', {'id':this.options.bodyId, 'class':'body'});
		this.body.setStyles({
			'width': this.options.width,
			'height': this.options.height,
			'max-height': this.options.maxHeight
		})
		this.body.inject(this.container, 'bottom');
		$chk(this.url) ? this.request() : $chk(this.htmlNode) ? this.body.set('html', this.htmlNode.clone(true, true).get('html')) : this.body.set('html', this.html);
	},
	renderFooter: function() {
		this.footer = new Element('footer');
		this.footer.inject(this.container, 'bottom');
    				
	},
	renderResizeCtrl: function() {
		this.resCtrl = new Element('div').setStyles({'position':'absolute', 'right':'0', 'bottom':'0', 'width':'10px', 'height':'10px', 'cursor':'se-resize'});
		this.resCtrl.inject(this.footer, 'top');		
	},
	makeDraggable: function() {
		var docDim = document.getCoordinates();
		if(this.options.draggable) {
			var dragInstance = new Drag(this.container, {
				'handle':this.header, 
				'limit':{'x':[0, (docDim.width-this.container.getCoordinates().width)], 'y':[0, ]}
			});
			this.header.setStyle('cursor', 'move');
		}
    
	},
	makeResizable: function() {
		this.renderResizeCtrl();
		var ylimit = $chk(this.options.maxHeight) 
			? this.options.maxHeight+this.header.getCoordinates().height+this.header.getStyle('margin-top').toInt()+this.header.getStyle('margin-bottom').toInt()+this.container.getStyle('padding-top').toInt()+this.container.getStyle('padding-bottom').toInt() 
			: document.body.getCoordinates().height-20;
		this.container.makeResizable({
			'handle':this.resCtrl, 
			'limit':{'x':[this.options.minWidth, (document.body.getCoordinates().width-20)], 'y':[this.options.minHeight, ylimit]},
			'onDrag': function(container) {this.resizeBody()}.bind(this),
			'onComplete': function(container) {this.makeDraggable()}.bind(this)
		});
	},
	resizeBody: function() {
		this.body.setStyles({
			'width': this.options.width.toInt()+(this.container.getCoordinates().width-this.initContainerDim.width),
			'height': this.initBodyHeight+(this.container.getCoordinates().height-this.initContainerDim.height)		
		});	      
	},
	request: function() {
		ajaxRequest('post', this.url, '', this.body, {'script':true, 'load':this.body});	 
	},
	setFocus: function() {
		if(!this.container.style.zIndex || (this.container.getStyle('z-index').toInt() < this.maxZindex))
			this.container.setStyle('z-index', ++this.maxZindex);
	},
	closeWindow: function() {
		this.showing = false;
		if(this.options.disableObjects) this.chain(this.container.dispose(), this.eObjects());
		else this.container.dispose();
    		if($chk(this.options.closeCallback)) this.options.closeCallback(this.options.closeCallbackParam);		
		if(this.options.destroyOnClose) for(var prop in this) this[prop] = null;
	},
	getViewport: function() {
		var width, height, left, top, cX, cY;
		// the more standards compliant browsers (mozilla/netscape/opera/IE7) use window.innerWidth and window.innerHeight
		if (typeof window.innerWidth != 'undefined') {
			width = window.innerWidth,
			height = window.innerHeight
		}
		// IE6 in standards compliant mode (i.e. with a valid doctype as the first line in the document)
		else if (typeof document.documentElement != 'undefined' && typeof document.documentElement.clientWidth !='undefined' && document.documentElement.clientWidth != 0) {
			width = document.documentElement.clientWidth,
			height = document.documentElement.clientHeight
		}

		top = $chk(self.pageYOffset) 
			? self.pageYOffset 
			: (document.documentElement && $chk(document.documentElement.scrollTop))
				? document.documentElement.scrollTop
				: document.body.clientHeight;

		left = $chk(self.pageXOffset) 
			? self.pageXOffset 
			: (document.documentElement && $chk(document.documentElement.scrollTop))
				? document.documentElement.scrollLeft
				: document.body.clientWidth;

		cX = left + width/2;

		cY = top + height/2;

		return {'width':width, 'height':height, 'left':left, 'top':top, 'cX':cX, 'cY':cY};

	},
	getMaxZindex: function() {
		var maxZ = 0;
		$$('body *').each(function(el) {if(el.getStyle('z-index').toInt()) maxZ = Math.max(maxZ, el.getStyle('z-index').toInt())});

		return maxZ;  
	}

})
