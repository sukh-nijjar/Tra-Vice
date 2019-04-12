/*
	Overflow by HTML5 UP
	html5up.net | @ajlkn
	Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)
*/

(function($) {

	var	$window = $(window),
		$body = $('body'),
		settings = {

			// Parallax background effect?
				parallax: true,

			// Parallax factor (lower = more intense, higher = less intense).
				parallaxFactor: 10

		};

	// Breakpoints.
		breakpoints({
			wide:    [ '1081px',  '1680px' ],
			normal:  [ '841px',   '1080px' ],
			narrow:  [ '737px',   '840px'  ],
			mobile:  [ null,      '736px'  ]
		});

	// Mobile?
		if (browser.mobile)
			$body.addClass('is-scroll');

	// Play initial animations on page load.
		$window.on('load', function() {
			window.setTimeout(function() {
				$body.removeClass('is-preload');
			}, 100);
		});

	// Scrolly.
		$('.scrolly-middle').scrolly({
			speed: 1000,
			anchor: 'middle'
		});

		$('.scrolly').scrolly({
			speed: 1000,
			offset: function() { return (breakpoints.active('<=mobile') ? 70 : 190); }
		});

	// Parallax background.

		// Disable parallax on IE/Edge (smooth scrolling is jerky), and on mobile platforms (= better performance).
			if (browser.name == 'ie'
			||	browser.name == 'edge'
			||	browser.mobile)
				settings.parallax = false;

		if (settings.parallax) {

			var $dummy = $(), $bg;

			$window
				.on('scroll.overflow_parallax', function() {

					// Adjust background position.
						$bg.css('background-position', 'center ' + (-1 * (parseInt($window.scrollTop()) / settings.parallaxFactor)) + 'px');

				})
				.on('resize.overflow_parallax', function() {

					// If we're in a situation where we need to temporarily disable parallax, do so.
						if (breakpoints.active('<=narrow')) {

							$body.css('background-position', '');
							$bg = $dummy;

						}

					// Otherwise, continue as normal.
						else
							$bg = $body;

					// Trigger scroll handler.
						$window.triggerHandler('scroll.overflow_parallax');

				})
				.trigger('resize.overflow_parallax');

		}

	// Poptrox.
		$('.gallery').poptrox({
			useBodyOverflow: false,
			usePopupEasyClose: false,
			overlayColor: '#0a1919',
			overlayOpacity: 0.75,
			usePopupDefaultStyling: false,
			usePopupCaption: true,
			popupLoaderText: '',
			windowMargin: 10,
			usePopupNav: true
		});

		// these 2 are used to scroll the screen along
		$("#scroll_on_submit, #scroll_to_stations_for_line").hide();

		$(".line_button").on("click", function(){
			let line_selected = $(this).text();
			$.ajax({
				data : {
					line : line_selected
				},
				type : "GET",
				url : "/stations"
			})
			.done(function(data){
				// associate *SET* the line with the unordered list which contains dynamically created li elements (1 per station)
				// this stores data against the element but does not affect the DOM
				// don't confuse this data function with the data being processed by .done()!
				$("#stations_list").data("line_name", line_selected);

				const stations = [];
				$.each(data.done, function(i,item){
					textToStrip = stringToRemove(item.commonName);
					shortenedStationName = removeTextFromString(item.commonName,textToStrip);
					stations.push(shortenedStationName);
				});

				// clear out arrivals information from previous request
				if ($("#arrivals_rows").length) {
					clearArrivalsTable();
				}
				// clear out existing radio buttons from previous request
				$("#stations_list").empty();
				// display line name for the stations being displayed
				$(".stations_for_line").text(line_selected + " line stations");
				// build new set of radio buttons
				stations.forEach(buildStationsCollection);
				// hide the get trains link
				$("div.get_trains").hide();
				$("#scroll_to_stations_for_line").trigger("click");

			})//end .done function
			.fail(function(data) {
				// replace this by scrolling to a error panel
				console.log(data.error_msg);
			})
		});

		$("ul").delegate("li label","click", function() {
			// hide any divs (containing 'get trains' anchor tag)
			// made visible each time a label is clicked
			$("div.get_trains:visible").each(function() {
				$(this).hide();
			})
			// make visible the div containing 'get trains' anchor tag
			$(this).nextAll("div.get_trains").show();
		})

		// CODE TO INVOKE AJAX CALL TO '/arrivals'
		$("ul").delegate(".arrivals_link", "click", function() {
			// let station = $(this).closest("ul li").find("label").text();
			// get params required for calling arrivals API
			let station_name = $(this)
			.closest("ul li")
			.find("input").val();
			// retrieve *GET* the line from the data stored against #stations_list
			let line_selected = $("#stations_list").data("line_name");
			console.log("LINE SELECTED ", line_selected);
			$.ajax({
				data: {
					station : station_name,
					line : line_selected
				},
				type : "GET",
				url : "/arrivals"
			})
			.done(function(data) {
				if (data.done) {
					console.log("DATA",data);
					// clear out arrivals information from previous request
					if ($("#arrivals_rows").length) {
						clearArrivalsTable();
					}
					$("#arrivals_table").append("<thead><tr><th>Destination</th>" +
														 "<th>Expected</th></tr></thead>");

					$.each(data.done, function(i,item) {
						buildArrivalsTable(item);
						// console.log("NaptanID ", item.naptanId);
					})
					$('#arrivals_station').append(data.station);
				} else {
					console.log("need to implement no arrivals use case");
				}
			})// end done
			.fail(function(data) {
				console.log(data.error_msg);
			})
		})

		function removeTextFromString(str, textToStrip) {
			const result = str.replace(textToStrip,"").trim();
			return result;
		}
		//
		function buildStationsCollection(element) {
			let input_element = "<input id='" + element + "' type='radio' name='selected_station' value='" + element + "'>";
			let label_elemet = "<label for='" + element + "'>" + element + "</label>";
			let check_div = "<div class='check'></div>";
			let get_trains_div = "<div class='get_trains'><a href='#banner' class='arrivals_link'>Get Trains</a></div>";
			$("#stations_list").append(`<li>` + input_element + label_elemet + check_div + get_trains_div + `</li>`);
		}

		function buildArrivalsTable(element) {
			console.log("param passed to stringToRemove = ", element.destinationName);
			let textToStrip = stringToRemove(element.destinationName);
			let station_name = removeTextFromString(element.destinationName,textToStrip);
			let arrival_time = new Date(element.expectedArrival).toTimeString();
			let table_row = "<tr><td>" + station_name + "</td>" +
											"<td>" + arrival_time.slice(0,5) + "</td></tr>"

			$('#arrivals_rows').append(table_row);
		}

		function clearArrivalsTable() {
			$('#arrivals_station').empty();
			$("#arrivals_rows").empty();
			$("thead").remove();
		}

		function stringToRemove(str) {
			console.log("function stringToRemove param in = ", str);
			if (str.includes("Underground")) {
				string_To_Remove = "Underground Station";
			} else {
				string_To_Remove = "Rail Station";
			};
			return string_To_Remove;
		}

})(jQuery);
