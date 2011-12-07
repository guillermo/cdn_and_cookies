/**
 * Heavily influenced by Hakim El Hattab's work: http://hakim.se/experiments/css3-3d-slideshow
 */

var Prezo = (function(){
	var slideContainer;

	var currSlide = 0;

	function init() {
		slideContainer = document.querySelector("#slideshow");
		slideContainer._origWidth = slideContainer.offsetWidth;
		slideContainer._origHeight = slideContainer.offsetHeight;
		slideContainer._aspectRatio = slideContainer._origWidth / slideContainer._origHeight;

		setupEvents();
		readURL();
		onResize();

 		if (typeof slideContainer.webkitRequestFullScreen == 'function') slideContainer.webkitRequestFullScreen();
 		else if (typeof slideContainer.requestFullScreen == 'function') slideContainer.requestFullScreen();
	}

	function setupEvents() {
		document.addEventListener('keydown', onDocumentKeyDown, false);
		document.addEventListener('touchstart', onDocumentTouchStart, false);
		document.addEventListener('mousewheel', onDocumentMouseWheel, false);
		window.addEventListener('hashchange', onWindowHashChange, false);
		window.addEventListener('resize', onResize, false);	
		window.addEventListener('orientationchange', onResize, false);	

		setupSlideAnimationEvents();
	}

	/**
	 * Hide slides when animation is complete
	 */
	function setupSlideAnimationEvents() {
		// TODO: move selector somewhere else
		var slides = Array.prototype.slice.call(document.querySelectorAll('#slideshow>section'));
		
		if (slides.length < 1) return;

		slides.map(function(element) {
			if (element.className != 'present') element.setAttribute('style', 'display: none;');

			// TODO don't write the same function twice :E
			element.addEventListener('transitionEnd', function(event) {
				if (element.className != 'present') element.setAttribute('style', 'display: none;');
			});
			element.addEventListener('webkitTransitionEnd', function(event) {
				if (element.className != 'present') element.setAttribute('style', 'display: none;');
			});
		});			
	}
	
	if (navigator.userAgent.indexOf('Firefox') != -1) {
		/**
		 * Resizes slide container so that it always fills the browser screen
		 */
		function setSlideContainerScale(scale) {
			var s = "scale("+scale+")";

			slideContainer.style.MozTransform = s;
		}
	} else {
		/**
		 * Resizes slide container so that it always fills the browser screen
		 */
		function setSlideContainerScale(scale) {
			var s = "scale3d("+scale+","+scale+",1)";

			slideContainer.style.webkitTransform = s;
		}
	}

	function onResize(e) {
		var w = window.innerWidth;
		var h = window.innerHeight;

		console.log('window: w:'+w+', h:'+h);
		console.log('slides: w:'+slideContainer._origWidth+', h:'+slideContainer._origHeight);

		slideContainer.style.position = "absolute";
		slideContainer.style.left = Math.round((w-slideContainer._origWidth)/2)+'px';
		slideContainer.style.top = Math.round((h-slideContainer._origHeight)/2)+'px';

		var war = w/h; // window aspect ratio
		var scale = 1.0;

		if (w < slideContainer._origWidth || h < slideContainer._origHeight) {
			if (war > slideContainer._aspectRatio) {
				scale = h / slideContainer._origHeight;			
			} else {
				scale = w / slideContainer._origWidth;
			}
		}

		setSlideContainerScale(scale);
	}

	/**
	 * Key-based navigation
	 */
	function onDocumentKeyDown(e) {
		if (e.keyCode >= 37 && e.keyCode <= 40) {
			switch (e.keyCode) {
				case 37: //left
				case 38: // up
					navigateLeft(); break;
				case 39: // right
				case 40: // down
					navigateRight(); break;
			}
			
			slide();
			
			e.preventDefault();
		}
	}

	/**
	 * Scrollwheel
	 */
	function onDocumentMouseWheel(e) {
		if (e.wheelDeltaY > 0) navigateLeft();
		else navigateRight();

		slide();

		e.preventDefault();
	}
	
	/**
	 * Touch-based navigation
	 */
	function onDocumentTouchStart(e) {
		// We're only interested in one point taps
		if (e.touches.length === 1) {
			// Never pre clicks on anchors
			if( e.target.tagName.toLowerCase() === 'a' || e.target.tagName.toLowerCase() === 'img' ) {
				return;
			}
			
			e.preventDefault();
			
			var point = {
				x: e.touches[0].clientX,
				y: e.touches[0].clientY
			};
			
			// Define the extent of the areas that may be tapped
			// to navigate
			var wt = window.innerWidth * 0.3;
			var ht = window.innerHeight * 0.3;
			
			if (point.x < wt) {
				navigateLeft();
			} else if( point.x > window.innerWidth - wt ) {
				navigateRight();
			}
			
			slide();
		}
	}

	/**
	 * Handler for the window level 'hashchange' event.
	 */
	function onWindowHashChange(event) {
		readURL();
	}

	/**
	 * Reads the current URL (hash) and navigates accordingly.
	 */
	function readURL() {
		// Break the hash down to separate components
		var s = window.location.hash.slice(2);
		
		currSlide = s ? parseInt(s) : 0;
		
		navigateTo(currSlide);
	}
	
	/**
	 * Updates the page URL (hash) to reflect the current
	 * navigational state. 
	 */
	function writeURL() {
		var url = '/'+currSlide;
				
		window.location.hash = url;
	}
		
	function updateSlides( selector, index ) {
		// Select all slides and convert the NodeList result to
		// an array
		var slides = Array.prototype.slice.call( document.querySelectorAll( selector ) );
		
		if( slides.length ) {
			// Enforce max and minimum index bounds
			index = Math.max(Math.min(index, slides.length - 1), 0);
			
			slides[index].removeAttribute('style');

			// NASTY HACK: If class change is not delayed, the transition doesn't play
			if (slides[index]._prezoHackTimer != undefined) clearTimeout(slides[index]._prezoHackTimer);
			slides[index]._prezoHackTimer = setTimeout(function() {
				slides[index].setAttribute('class', 'present');			
			}, 10);
			
			// Any element previous to index is given the 'past' class
			slides.slice(0, index).map(function(element){
				element.setAttribute('class', 'past');
			});
			
			// Any element subsequent to index is given the 'future' class
			slides.slice(index + 1).map(function(element){
				element.setAttribute('class', 'future');
			});
		} else {
			// Since there are no slides we can't be anywhere beyond the 
			// zeroth index
			index = 0;
		}
		
		return index;
		
	}
	
	/**
	 * Updates the visual slides to represent the currently
	 * set index.
	 */
	function slide() {
		currSlide = updateSlides('#slideshow>section', currSlide);
		
		writeURL();
	}

	/**
	 * Triggers a navigation to the specified index.
	 */
	function navigateTo(i) {
		currSlide = i === undefined ? currSlide : i;
		
		slide();
	}
	
	function navigateLeft() {
		currSlide --;
		slide();
	}
	function navigateRight() {
		currSlide ++;
		slide();
	}
	
	init();	
})();
