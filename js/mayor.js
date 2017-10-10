var my_viz_lib = my_viz_lib || {};

my_viz_lib.mayorPlot = function() {
	// Initial positional parameters
	var height = 600;
	var width = 1000;
	var margin = { top: 10, right: 160, bottom: 150, left: 60 };
	var figWidth = width - margin.left - margin.right;
	var figHeight = height - margin.top - margin.bottom;
	var maxY = 30000;
	// Keys for later lookup into the data
	var names = ["MERRITT", "WOODARDS", "LOPEZ"];
	// Accesor function for the bisector
	var bisectDate = d3.bisector(function(d) { return d.key; }).left;

	// Externally set the data
	var data = [];
	var data_ = function(_) {
		var that = this;
		if(!arguments.length) return data;
		data = _;
		return that;
	}

	// Externally set the max of the Y axis
	var maxY_ = function(_) {
		var that = this;
		if(!arguments.length) return data;
		maxY = _;
		return that;
	}

	// Configure scales
	var x = d3.scaleTime().range([margin.left, figWidth]);
	var y = d3.scaleLinear().range([margin.top, margin.top+figHeight]);
	var col = d3.scaleOrdinal(d3.schemeCategory10);

	// Build a line for a single candidate
	function makeLine(lastName) {
		return d3.line()
				.y(function(d) { return y(d.value[lastName]); })
				.defined(function(d) { return d.value[lastName]; })
				.x(function(d) { return x(d.key); });
	}


	// Draw the main plot
	function plot_() {
		// If the plot already exists, clear it out
		d3.selectAll("svg").remove()

		// Create the base svg
		var svg = d3.select("body").append("svg")
						.attr("height", height)
						.attr("width", width)

		// Create the inner g element for the plot
		var g = svg.append("g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		// Use the provided data to set the x and y domains
		x.domain(d3.extent(data, function(d) { return d.key; }));
		y.domain([maxY, 0]);
		col.domain(names);

		// The vertical line to highlight the mouse location
		var overlayLine = svg.append("line")
			.attr("class", "overlayLine")
			.attr("x1", x.range()[0]+margin.left)
			.attr("y1", y(0)+margin.top)
			.attr("x2", x.range()[0]+margin.left)
			.attr("y2", y(maxY)+margin.top+7)
			.attr("stroke-width", 10)
			.attr("stroke", "gray")
			.attr("opacity", "0.25")
			.style("display", "none");

		// General overlay to host mouse events
		var overlay = svg.append("rect")
			.attr("class", "overlay")
			.attr("width", figWidth-margin.left)
			.attr("height", figHeight)
			.attr("transform", "translate("+(2*margin.left)+","+(2*margin.top)+")")
			.on("mouseover", function() {
				overlayLine.style("display", "inline");
				statsBox.style("display", "inline");
				statsText.style("display", "inline");
			})
			.on("mouseout", function() {
				overlayLine.style("display", "none");
				statsBox.style("display", "none");
				statsText.style("display", "none");
			})
			.on('mousemove', vertical);

		// Elements for dollar values displayed on hover
		var stats = svg.selectAll(".stats")
			.data(names)
			.enter();

		// Bounding box of these values
		var statsBox = stats
			.append("rect")
			.attr("class", "statsBox")
			.attr("width", 60)
			.attr("height", 20)
			.attr("fill", function(d) { return col(d); })
			.style("display", "none");

		// The actual text elements of the values
		var statsText = stats
			.append("text")
			.attr("id", function(d) { return d; })
			.attr("class", "statsText")
			.style("font-size", "10px")
			.attr("text-anchor", "middle")
			.attr("fill", "white")
			.text("Testing")
			.style("display", "none");

		// Callback function for mouse movement over the plot
		function vertical() {
			// Monetary formating
			var fmt = function(d) {
				if(d) {
					return "$" + d3.format(",.2f")(d);
				} else {
					return "";
				}
			};

			// Get the current mouse position
			coords = d3.mouse(this)

			// Set the x value of the mouse in terms of the plot
			var xVal = x.range()[0] + margin.left+coords[0];

			// Find the effective date of the current x value, from the x scale
			var xDate = x.invert(coords[0]+margin.left);

			// Get the nearest surrounding points
			var i = bisectDate(data, xDate, 1),
				d0 = data[i-1],
				d1 = data[i];

			// Determine which of the surrounding points is nearest to the mouse location
			var nearest = xDate - d0.key > d1.key - xDate ? i : i-1;
			var nearDate = data[nearest].key;

			// Reposition and change content of the dollar value
			statsText
				.attr("x", x(nearDate)+margin.left)
				.attr("y", function(d) { return y(data[nearest].value[d])+margin.top; })
				.text(function(d) { return fmt(data[nearest].value[d]); });

			// Reposition the bounding box at the same time
			statsBox
				.attr("x", x(nearDate)+margin.left-30)
				.attr("y", function(d) { return y(data[nearest].value[d])+margin.top-13; })
				.style("display", function(d) {
					if(data[nearest].value[d]) {
						return "inline";
					} else {
						return "none";
					}
				});
				

			// Reposition the highlight line
			overlayLine
				.attr("x1", x(nearDate)+margin.left)
				.attr("x2", x(nearDate)+margin.left);
		}

		// Create the axes
		var xAxis = d3.axisBottom().scale(x);
		var yAxis = d3.axisLeft().scale(y).ticks(5);

		// Initialize the lines
		var candidates = g.selectAll(".candidate")
							.data(names);
		var candidatesEnter = candidates.enter()
					.append("g")
					.attr("class", "city")
					.attr("id", function(d) { return d; });

		// Draw lines for each candidate
		candidatesEnter.append("path")
						//.attr("class", "line")
						.attr("d", function(d) { return makeLine(d)(data); })
						.attr("stroke", function(d) { return col(d); })
						.attr("stroke-width", 2.5)
						.attr("fill", "none");

		candidatesEnter.append("text")
						.text(function(d) { return d; })
						.attr("x", function(d) {
							var filtered = data.filter(function(mn) {
								return mn.value[d] > 0;
							});
							var max = d3.max(filtered, function(f) { return f.key; });
							return x(max) + 2;
						})
						//.attr("y", y.range()[1])
						.attr("y", function(d) {
							var filtered = data.filter(function(mn) {
								return mn.value[d] > 0;
							});
							//var max = d3.max(filtered, function(f) { return f.value[d]; });
							var last = filtered[filtered.length-1].value[d];
							return y(last) + 4;
						})
						.attr("fill", function(d) { return col(d); })
						.style("font-size", "10px");

		// Static vertical marker for the primary election
		var primary = new Date("2017-08-01 00:00:00");
		g.append("line")
			.attr("x1", x(primary))
			.attr("y1", y(0))
			.attr("x2", x(primary))
			.attr("y2", y(maxY))
			.attr("stroke-width", 1.5)
			.attr("stroke", "red");

		g.append("rect")
			.attr("x", x(primary)-45)
			.attr("y", y(maxY)-13)
			.attr("height", 20)
			.attr("width", 90)
			.style("fill", "red");

		g.append("text")
			.text("Primary Election")
			.attr("x", x(primary))
			.attr("y", y(maxY))
			.attr("text-anchor", "middle")
			.style("fill", "white")
			.style("background-color", "blue")
			.style("font-size", "10px");

		// Static notes displayed below the plot, with bounding boxes
		var noteY = figHeight+margin.top+70;
		var notePad = 7;

		var woodDate = new Date("2016-12-01 00:00:00");
		var woodText = g.append("text")
			.attr("x", x(woodDate))
			.attr("y", noteY)
			.attr("class", "plotnote")
			.attr("id", "woodNote");
		woodText.append("tspan")
			.text("Victoria Woodards's early entry into the");
		woodText.append("tspan")
			.text("race provided a fundraising advantage,")
			.attr("x", x(woodDate))
			.attr("dy", 12);
		woodText.append("tspan")
			.text("which she has not relinquished.")
			.attr("x", x(woodDate))
			.attr("dy", 12);

		var woodBbox = woodText.node().getBBox();
		g.insert("rect", "#woodNote")
			.attr("x", woodBbox.x-notePad)
			.attr("y", woodBbox.y-notePad)
			.attr("width", woodBbox.width+notePad*2)
			.attr("height", woodBbox.height+notePad*2)
			.style("fill", col("WOODARDS"));


		var lopDate = new Date("2017-04-01 00:00:00");
		var lopText = g.append("text")
			.attr("x", x(lopDate))
			.attr("y", noteY)
			.attr("class", "plotnote")
			.attr("id", "lopezNote");
		lopText.append("tspan")
			.text("Evelyn Lopez entered the race late,");
		lopText.append("tspan")
			.text("never caught up in fundraising, and")
			.attr("x", x(lopDate))
			.attr("dy", 12);
		lopText.append("tspan")
			.text("did not progress past the primary.")
			.attr("x", x(lopDate))
			.attr("dy", 12);

		var lopBbox = lopText.node().getBBox();
		g.insert("rect", "#lopezNote")
			.attr("x", lopBbox.x-notePad)
			.attr("y", lopBbox.y-notePad)
			.attr("width", lopBbox.width+notePad*2)
			.attr("height", lopBbox.height+notePad*2)
			.style("fill", col("LOPEZ"));


		var bothDate = new Date("2017-07-01 00:00:00");
		var bothText = g.append("text")
			.attr("x", x(bothDate))
			.attr("y", noteY)
			.attr("class", "plotnote")
			.attr("id", "bothNote");
		bothText.append("tspan")
			.text("The two other candidates saw a donation");
		bothText.append("tspan")
			.text("spike just before the primary, followed by a ")
			.attr("x", x(bothDate))
			.attr("dy", 12);
		bothText.append("tspan")
			.text("drop while the votes were counted.")
			.attr("x", x(bothDate))
			.attr("dy", 12);

		var bothBbox = bothText.node().getBBox();
		g.insert("rect", "#bothNote")
			.attr("x", bothBbox.x-notePad)
			.attr("y", bothBbox.y-notePad)
			.attr("width", bothBbox.width+notePad*2)
			.attr("height", bothBbox.height+notePad*2)
			.style("fill", "red");
			

		// Axis labels
		g.append("text")
			.text("Dollars Donated")
			.attr("x", 0-(figHeight/2)-margin.top)
			.attr("y", 0)
			.attr("transform", "rotate(-90)")
			.attr("class", "axis-label")
			.attr("text-anchor", "middle");

		g.append("text")
			.text("Month")
			.attr("x", margin.left + figWidth/2)
			.attr("y", figHeight+margin.top+40)
			.attr("text-anchor", "middle")
			.attr("class", "axis-label");

		// Display axes
		g.append("g")
			.attr("class", "axis")
			.attr("transform", "translate(0, "+(margin.top + figHeight)+")")
			.call(xAxis);

		g.append("g")
			.attr("class", "axis")
			.attr("transform", "translate("+margin.left+",0)")
			.call(yAxis);
	}

	// Expose public functions
	var public = {
		"plot": plot_,
		"data": data_,
		"maxY": maxY_
	};

	return public;
};


// Convert rows from strings to useable data formats
var rowConverter = function(d) {
	var timeParse = d3.timeParse("%m/%d/%Y %H:%M:%S %p")

	return {
		"receiptDate": timeParse(d["receipt_date"]),
		"lastName": d["last_name"],
		"amount": parseFloat(d["amount"].replace("$", ""))
	};
}

// Load the data file
d3.csv("data/monthly.csv", rowConverter, function(monthly) {
	// Process the data from long to wide format
	var monthlyNested = d3.nest()
					.key(function(d) { return new Date(d["receiptDate"]); })
					.rollup(function(d) {
						return d.reduce(function(prev, curr) {
							prev["receiptDate"] = curr["receiptDate"];
							prev[curr["lastName"]] = curr["amount"];
							return prev;
						}, {});
					})
					.entries(monthly);

	// Reprocess the data from long to wide, while converting the amounts to cumulative sums
	var monthlyNestedCumulative = d3.nest()
					.key(function(d) { return new Date(d["receiptDate"]); })
					.rollup(function(d) {
						return d.reduce(function(prev, curr) {
							prev["receiptDate"] = curr["receiptDate"];
							prev[curr["lastName"]] = curr["amount"];
							return prev;
						}, {});
					})
					.entries(monthly);

	// Sort 
	monthlyNested.forEach(function(d) { d.key = new Date(d.key); });
	monthlyNested.sort(function(a, b) { return a.key - b.key; });
	monthlyNestedCumulative.forEach(function(d) { d.key = new Date(d.key); });
	monthlyNestedCumulative.sort(function(a, b) { return a.key - b.key; });

	for(var i = 1; i < monthlyNestedCumulative.length; i++) {
		if(monthlyNestedCumulative[i-1].value["WOODARDS"])
			monthlyNestedCumulative[i].value["WOODARDS"] = monthlyNestedCumulative[i].value["WOODARDS"] + monthlyNestedCumulative[i-1].value["WOODARDS"];
		if(monthlyNestedCumulative[i-1].value["MERRITT"])
			monthlyNestedCumulative[i].value["MERRITT"] = monthlyNestedCumulative[i].value["MERRITT"] + monthlyNestedCumulative[i-1].value["MERRITT"];
		if(monthlyNestedCumulative[i-1].value["LOPEZ"])
			monthlyNestedCumulative[i].value["LOPEZ"] = monthlyNestedCumulative[i].value["LOPEZ"] + monthlyNestedCumulative[i-1].value["LOPEZ"];
	}

	console.log(monthlyNestedCumulative);
	


	var myMayor = my_viz_lib.mayorPlot();
	myMayor.data(monthlyNestedCumulative).maxY(140000);
	myMayor.plot();

	var cumulativeFlag = true;

	d3.select("#form")
		.on("click", function() {
			if(cumulativeFlag) {
				myMayor.data(monthlyNested).maxY(30000);
				d3.select("#form").text("Click to view cumulative totals.");
				d3.select("#type").text("Monthly");
			} else {
				myMayor.data(monthlyNestedCumulative).maxY(140000);
				d3.select("#form").text("Click to view monthly totals.");
				d3.select("#type").text("Cumulative");
			}
			cumulativeFlag = !cumulativeFlag;
			myMayor.plot();
		})
		.on("mousedown", function() {
			d3.select("#form").attr("class", "in");
		})
		.on("mouseup", function() {
			d3.select("#form").attr("class", "out");
		});
	
});
