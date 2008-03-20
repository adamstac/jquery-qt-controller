
	
(function($) {

	jQuery.jQQTC = function() {


		/************ QuickTime detection **************/
		

		// Notification message if QuickTime is not installed
		var QT_INSTALL = 'Quicktime is required<br/><a href="http://www.apple.com/quicktime/download/">http://www.apple.com/quicktime/download</a>';


		// QuickTime installed or not
		var QT = false;
		if (navigator.plugins) {
			for (i=0; i < navigator.plugins.length; i++) {
				if (navigator.plugins[i].name.indexOf("QuickTime") >= 0) { QT = true; }
			}
		}
		if (!QT) {
			var qtm = '<div class="jQQT_install">'+ QT_INSTALL +'</div>';
			$('.jQQT_movie_container').append(qtm);
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
			var o = new Object();
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



		// Movie dimension and other info gotten from the a tag
	
		// We'll use the filename as the id of the movie
		var ta = $('.jQQT_movie').html().split('.');

		var mid = ta[0];
		var murl = $('.jQQT_movie').attr('href');

		ta = $('.jQQT_movie').attr('class');
		var so = ta.split('jQQT_movie ')[1];
		var styleo = safeObject(so);


		if ((styleo.width == undefined) || (styleo.width == undefined)) {
			var err = '<div class="jQQT_err">Width and height parameters must be specified</div>';
			$('.jQQT_movie_container').append(err);
			return;
		}
		
		
		var mwidth = styleo.width || false;
		var mheight = styleo.height || false;
		var mauto = styleo.autoplay || true;
		var mcache = styleo.cache || true;
		var mbgcolor = styleo.bgcolor || '#000000';

		// Remove the original link text
		$('.jQQT_movie').html('');


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



		/*********** Generate the plugin code by calling the _QTGenerate function from AC_QuickTime.js. This should later be handled by jQQTC itself. ***********/

		var m = _QTGenerate("QT_WriteOBJECT", false, args);




		/*************** Generate the video controllers *******************/

		var c = '<div class="jQQT_controller">'
				+ '<div class="jQQT_button jQQT_play"></div> '
				+ '<div class="jQQT_playbar">'
					+ '<div class="jQQT_play_head"></div>'
					+ '<div class="jQQT_track_bg"></div>'
					+ '<div class="jQQT_track_loaded"></div>'
				+ '</div>'
				+ '</div>';




		/************* Insert the movie and controller on to the page **************/

		$('.jQQT_movie_container').append(m).append(c);


		/*************** Adjust the movie container's width -> will help center the content *********/
				$('.jQQT_movie_container').css('width', mwidth*1);



		/**************** Adjust the play bar's width ********************/
		
		var pw = parseInt(mwidth) - parseInt($('.jQQT_button').css('width')) - WIDTH_OFFSET + 'px';
		$('.jQQT_playbar').css('width', pw);






		/************ Some parameters which can be gotten only after the controls are embedded ************/

		var playbar_width = parseInt($('.jQQT_playbar').css('width'));
		var playhead_width = parseInt($('.jQQT_play_head').css('width'));




		/************** Play/Pause controls ***********************/
		$('.jQQT_button').click(function() {

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
						$('.jQQT_button').removeClass('jQQT_play').addClass('jQQT_pause');
						}, AUTOPLAY_TIME);
				}

				// Show the loading status
				mlt = setInterval(function() {
					
					if (document[mid].GetMaxBytesLoaded() >= document[mid].GetMovieSize()) {
						clearInterval(mlt);
						$('.jQQT_track_loaded').css('width', '100%');
						return;
					}
					else {					
						var pl = (document[mid].GetMaxBytesLoaded()/document[mid].GetMovieSize())*100;
						$('.jQQT_track_loaded').css('width', pl+'%');
					}
				}, LOAD_RATE);





				/******** Playhead drag navigator *************/

				// Mouse down flag for playhead
				var playHead = {
					mdown:false,
					ph_lastx:0,
					startx:0
				};

				$('.jQQT_play_head').mousedown(function(e) {
					playHead.mdown = true;
					playHead.startx = e.clientX;			
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
						var rx = e.clientX - playHead.startx;
						
						// The timeline to jump the movie to
						var jumpt = Math.floor((tmtime*playhead_pos)/playbar_width);
						playhead_pos = playHead.ph_lastx + rx;

						jumpTo(jumpt, playhead_pos);

					}

				});

			}, LOADED_CHECK_RATE);
		})();

	




		/*********** Jump navigation via click clicking on the play bar *************/

		$('.jQQT_track_loaded').click(function(e) {
		
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
					$('.jQQT_play_head').css('left', '0px');
					// Change the play button to ready to play state
					$('.jQQT_button').removeClass('jQQT_pause').addClass('jQQT_play');
					// Set the playing status to false
					pp = false;
					return;
				}

				$('.jQQT_play_head').css('left', rtime_pos+'px');
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
			$('.jQQT_play_head').css('left', jumpp+'px');
		}



		/************* Play the movie *************/

		function playMovie() {
				pp = true;
				trackPlayhead();
				document[mid].Play();				
				$('.jQQT_button').removeClass('jQQT_play').addClass('jQQT_pause');
		}

		/************* Stop the movie ****************/

		function stopMovie() {
				pp = false;
				stopPlayheadTrack();
				document[mid].Stop();
				$('.jQQT_button').removeClass('jQQT_pause').addClass('jQQT_play');
		}



		/********* debug ***********/
		function trace(v) {
			$('#stat').html(v);
		}


	};
	
})(jQuery);