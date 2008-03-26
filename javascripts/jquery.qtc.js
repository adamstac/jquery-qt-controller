	
;(function($) {

$.fn.qtc = function(options) {
  return this.each(function() {

    var $this = $(this);
    $this.addClass('qtc_movie').wrap('<div class="qtc_movie_container"></div>');
    var $p = $this.parent();
      // support metadata plugin (v1.0 and 2.0)
    var opts = $.extend({}, $.fn.qtc.defaults, options || {}, 
        $.metadata ? $this.metadata() : $.meta ? $this.data() : {});
    

    $p.addClass(opts.theme);
    
		/************ QuickTime detection **************/
		

		// Notification message if QuickTime is not installed
		var QT_INSTALL = 'Quicktime is required<br/><a href="http://www.apple.com/quicktime/download/">http://www.apple.com/quicktime/download</a>';


		// QuickTime installed or not
		var QT = false;
		if (navigator.plugins) {
      for (var np = navigator.plugins, i = np.length - 1; i >= 0; i--){
        if (np[i].name.indexOf('QuickTime') != -1) {QT = true; }
      }
		}
		if (!QT) {
			var qtm = '<div class="qtc_install">'+ QT_INSTALL +'</div>';
			$p.append(qtm);
			return;
		}




		/******************** If execution proceeds past this, QuickTime is installed **********************/


		// Get the number of items in an object
		function icount(o) {
			var i = 0;
			for (j in o) { i++; }
			return i;
		}

		// Create objects from JSON in a 'safe' manner (without using eval())
		function safeObject(s) {
			var o = {};
			var a0 = s.split(',');
			var al = a0.length-1;
			$.each(a0, function(i) {
				// First item
				if (i == 0) {
					var sl = this.length-1;
					var nv = this.substr(1, sl);
				}
				// Last item
				else if (i == al) {
					var sl = this.length-1;
					var nv = this.substr(0, sl);
				}
				// Mid items
				else { var nv = this; }
				nv = nv.replace(' ', '');

				var nva = nv.split(':');
				o[nva[0]] = nva[1];

			});
			return o;
		}






		// Playbar width offset
		var WIDTH_OFFSET = 5;
		// How frequentlt to check if the movie header info is available, in ms
		var LOADED_CHECK_RATE = 200;
		// How frequently to update the loading status, in ms
		var LOAD_RATE = 50;
		// How frequently to update the playhead position, in ms
		var PLAYHEAD_RATE = 50;
		// Whent to start playing when Autoplay is on
		var AUTOPLAY_TIME = 100;

		// Play/Pause (true/false)
		var pp = false;

		// Playhead tracker is on/off
		var pht_running = false;

	
		// We'll use the filename as the id of the movie
		var murl = $this.attr('href');
    var mid = murl.slice(murl.lastIndexOf('/')+1,murl.lastIndexOf('.'));

		if (opts.width == undefined || opts.height == undefined) {
			var err = '<div class="qtc_err">Width and height parameters must be specified</div>';
			$p.append(err);
			return;
		}
		
		
		var mwidth = opts.width || false;
		var mheight = opts.height || false;
		var mauto = opts.autoplay || true;
		var mcache = opts.cache || true;
		var mbgcolor = opts.bgcolor || '#000000';

		// Remove the original link text
		$this.html('');


		// Movie size etc gotten from the server/after the movie is loaded
		var msize;
		var mloaded;

		// Total movie time duration
		var tmtime;
		// Current movie time
		var cmtime;


		// setInterval holder for checking loaded 
		var mlt;
		// setInterval holder for keeping track of the playhead
		var pht;


		var args = [murl, mwidth, mheight,''];
		args.push('controller');
		args.push('false');
		args.push('id');
		args.push(mid);
		args.push('autoplay');
		args.push(mauto);
		args.push('cache');
		args.push(mcache);
		args.push('bgcolor');
		args.push(mbgcolor);



		/*********** Generate the plugin code by calling the _QTGenerate function from AC_QuickTime.js. This should later be handled by qtc itself. ***********/

		var m = _QTGenerate("QT_WriteOBJECT", false, args);




		/*************** Generate the video controllers *******************/

    var c = ['<div class="qtc_controller">',
    		'<div class="qtc_button qtc_play"></div> ',
    		'<div class="qtc_playbar">',
    		  '<div class="qtc_play_head"></div>',
    		  '<div class="qtc_track_bg"></div>',
    		  '<div class="qtc_track_loaded"></div>',
    		'</div>',
    		'</div>'].join('');

		/************* Insert the movie and controller on to the page **************/

		$p.append(m).append(c);


		/*************** Adjust the movie container's width -> will help center the content *********/
				$p.css('width', mwidth*1);



		/**************** Adjust the play bar's width ********************/
		
		var pw = parseInt(mwidth) - parseInt($('.qtc_button').css('width')) - WIDTH_OFFSET + 'px';
		$('div.qtc_playbar').css('width', pw);






		/************ Some parameters which can be gotten only after the controls are embedded ************/

		var playbar_width = parseInt($('div.qtc_playbar').css('width'));
		var playhead_width = parseInt($('div.qtc_play_head').css('width'));




		/************** Play/Pause controls ***********************/
		$('div.qtc_button').click(function() {

			// If the movie can't be played, return
			if ((document[mid].GetPluginStatus() != 'Playable') && (document[mid].GetPluginStatus() != 'Complete')) { return; }
			
			// Toggle Play/Pause
			if (pp) { stopMovie(); }
			else { playMovie(); }

		});




		/************** We set a timeout to make sure movie header data has been loaded. Equivalent to onMovieReady ****************/

		(function initMovie() {
			var t = setTimeout(function() {

				if ((document[mid] == undefined) || (document[mid].GetPluginStatus() == 'Waiting')) {
					return initMovie();					
				}



				// Total movie length
				tmtime = document[mid].GetDuration();

				// Autostart by default?
				if(document[mid].GetAutoPlay()) {
					document[mid].SetAutoPlay(false);
					setTimeout(function() {
						pp = true;
						trackPlayhead();
						document[mid].Play();				
						$('div.qtc_button').removeClass('qtc_play').addClass('qtc_pause');
						}, AUTOPLAY_TIME);
				}

				// Show the loading status
				mlt = setInterval(function() {
					
					if (document[mid].GetMaxBytesLoaded() >= document[mid].GetMovieSize()) {
						clearInterval(mlt);
						$('div.qtc_track_loaded').css('width', '100%');
						return;
					}
					else {					
						var pl = (document[mid].GetMaxBytesLoaded()/document[mid].GetMovieSize())*100;
						$('div.qtc_track_loaded').css('width', pl+'%');
					}
				}, LOAD_RATE);





				/******** Playhead drag navigator *************/

				// Mouse down flag for playhead
				var playHead = {
					mdown:false,
					ph_lastx:0,
					startx:0
				};

				$('div.qtc_play_head').mousedown(function(e) {
					playHead.mdown = true;
					playHead.startx = e.pageX;			
					stopMovie();
					playHead.ph_lastx = playheadPos();
				});
				

				$(document).mouseup(function(e) {
					if (playHead.mdown) { 
						playHead.mdown = false;
						playMovie();
					}
				});
				
				$(document).mousemove(function(e) {

					if ((document[mid] == undefined) || (document[mid].GetPluginStatus() == 'Waiting')) { return; } 

					var playhead_pos = playheadPos();

					// Limit the position of the playbar
					if ((playhead_pos >= (playbar_width - playhead_width)) || (playhead_pos <= 0)) { return; }


					if (playHead.mdown) {

						if (pht_running) { stopPlayheadTrack(); }			
						var rx = e.pageX - playHead.startx;
						
						// The timeline to jump the movie to
						var jumpt = Math.floor((tmtime*playhead_pos)/playbar_width);
						playhead_pos = playHead.ph_lastx + rx;

						jumpTo(jumpt, playhead_pos);

					}

				});

			}, LOADED_CHECK_RATE);
		})();

	




		/*********** Jump navigation via click clicking on the play bar *************/

		$('div.qtc_track_loaded').click(function(e) {
		
			var lx = e.layerX;
		
			// The timeline to jump the movie to
			var jumpt = Math.floor((tmtime*lx)/playbar_width);		

			jumpTo(jumpt, lx);
			playMovie();
			
		});


		/************* Playhead tracker ******************/
		// Returns the playhead position - based on the amount of time the movie has played
		function playheadPos() {

			var cmtime = document[mid].GetTime();
			var rtime = (cmtime/tmtime)*100;
			return parseInt((rtime/100)*playbar_width);
		}


		function trackPlayhead() {


			// If the tracker was already initialized, turn it off first
			clearInterval(pht);
			pht_running = true;

			// Reinitialize the tracker
			pht = setInterval(function() {

				var rtime_pos = playheadPos();

				//trace(rtime_pos +' : ' + playhead_width +' : '+ playbar_width);

				// Has the movie ended?
				if ((rtime_pos + playhead_width) >= playbar_width) {
					// Clear the playhead tracking timer
					clearInterval(pht);
					// Reposition the playhead
					$('div.qtc_play_head').css('left', '0px');
					// Change the play button to ready to play state
					$('div.qtc_button').removeClass('qtc_pause').addClass('qtc_play');
					// Set the playing status to false
					pp = false;
					return;
				}

				$('div.qtc_play_head').css('left', rtime_pos+'px');
			}, PLAYHEAD_RATE);

		}

		function stopPlayheadTrack() { clearInterval(pht); }



		/********** Jump the movie play to *************/

		// jumpt == movie timeline
		// jumpp == playhead position
		function jumpTo(jumpt, jumpp) {
			// Jump the movie
			document[mid].SetTime(jumpt);
			// Position the playhead
			$('div.qtc_play_head').css('left', jumpp+'px');
		}



		/************* Play the movie *************/

		function playMovie() {
				pp = true;
				trackPlayhead();
				document[mid].Play();				
				$('div.qtc_button').removeClass('qtc_play').addClass('qtc_pause');
		}

		/************* Stop the movie ****************/

		function stopMovie() {
				pp = false;
				stopPlayheadTrack();
				document[mid].Stop();
				$('div.qtc_button').removeClass('qtc_pause').addClass('qtc_play');
		}



		/********* debug ***********/
		function trace(v) {
			$('#stat').html(v);
		}

  });
};


$.fn.qtc.defaults = {
  width:    448,
  height:   252,
  autoplay: true,
  bgcolor:  '#fff',
  theme: 'min'
};  
	
})(jQuery);
