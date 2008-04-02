jQuery QT Controller 0.9.1
======================================

jQuery Quicktime Controller is a quicktime movie controller interface powered by jQuery.

It's still in it's early phases of being a clean, bug-free plugin. I'm waiting on Karl Swedberg to send me his SVN diff file to merge his new changes into the repository.

If you have been on the lookout for a jQuery plugin to help you build a better UI for your Quicktime movies, you may want to check out this plugin.

If you are a JavaScript Ninja, please get involved and help improve the plugin or add new features that everyone can use.


Basic usage revolves around the use of this simple `markup` like so:

	<div class="jQQT_movie_container">
		<noscript><p>Please enable JavaScript to view this page properly.</p></noscript>
		<a class="jQQT_movie {width:448,height:252,autoplay:true,bgcolor:#fff}" href="http://www.image202.com/files/media/TG_Homeless_J.mov">TG_Homeless_J.mov</a>
	</div>

This will then populate the DOM with the proper Quicktime embed code.

Function
---------

jQuery Quicktime Controller should:

* Build the quicktime embed in the DOM using a class hook.
* If JavaScript is not enabled fall back on an image if possible, or at least fall back on the "noscript" tag in the markup. Also would like to create new markup in the DOM just inside the body tag indicating to "Please enable JavaScript to view this page properly."
* If Quicktime is not installed, insert alternate markup with class hooks to style a "Quicktime is required" box and provide a link to Apple.com/quicktime
* Build the controller markup by referencing a div with the class "jQQT_controller"
* jQQT_play_head should be click-drag-able to jog through the video
* The "track" should be click-able to jump the video to the clicked point
* The control button should toggle from pause to play respectively updating the class from play to pause to allow for CSS styling to alter the representative graphic of play or pause.
* Allow the user to set the width and height from the markup level. If the width and height isn't given the plugin must set it for the user (if possible).
* Allow setting the quicktime movie's background color

Compatibility
-------------

This plugin has been tested with jQuery 1.2.1 and newer and should work in all browsers supported by jQuery itself (it has been tested with Safari 3 and newer, Mozilla Firefox 2 and newer, Opera 9.26 and Internet Explorer 6).

Licensing
---------

Copyright (c) 2008 Adam Stacoviak - http://www.adamstacoviak.com/

Licensed under the MIT (MIT-LICENSE.txt) License.

This program is free software; you can redistribute it and/or modify
it under the terms of the MIT-LICENSE.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
MIT License for more details.