var my_viz_lib = my_viz_lib || {};

my_viz_lib.mayorPlot = function() {
	var height = 600;
	var width = 1000;
	var margin = { top: 30, right: 160, bottom: 150, left: 60 };
	var figWidth = width - margin.left - margin.right;
	var figHeight = height - margin.top - margin.bottom;
	var maxY = 30000;
	var names = ["MERRITT", "WOODARDS", "LOPEZ"];
	var bisectDate = d3.bisector(function(d) { return d.key; }).left;

	var data = [];
	var data_ = function(_) {
		var that = this;
		if(!arguments.length) return data;
		data = _;
		return that;
	}


	var x = d3.scaleTime().range([margin.left, figWidth]);
	var y = d3.scaleLinear().range([margin.top, margin.top+figHeight]);
	var col = d3.scaleOrdinal(d3.schemeCategory10);

	function makeLine(lastName) {
		return d3.line()
				.y(function(d) { return y(d.value[lastName]); })
				.defined(function(d) { return d.value[lastName]; })
				.x(function(d) { return x(d.key); });
	}



	function plot_() {
		var svg = d3.select("body").append("svg")
						.attr("height", height)
						.attr("width", width)


		var g = svg.append("g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		x.domain(d3.extent(data, function(d) { return d.key; }));
		y.domain([maxY, 0]);
		col.domain(names);

		var overlayLine = svg.append("line")
			.attr("x1", x.range()[0]+margin.left)
			.attr("y1", y(0)+margin.top)
			.attr("x2", x.range()[0]+margin.left)
			.attr("y2", y(maxY)+margin.top)
			.attr("stroke-width", 10)
			.attr("stroke", "gray")
			.attr("opacity", "0.25");

		var overlay = svg.append("rect")
			.attr("class", "overlay")
			.attr("width", figWidth-margin.left)
			.attr("height", figHeight)
			.attr("transform", "translate("+(2*margin.left)+","+(2*margin.top)+")")
			.on("mouseover", function() { overlayLine.style("display", null); })
			.on("mouseout", function() { overlayLine.style("display", "none"); })
			.on('mousemove', vertical);

		var stats = svg.append("text")
			.attr("class", "stats")
			.attr("x", 2*margin.left+20)
			.attr("y", 2*margin.top+20);
		var woodStat = stats.append("tspan")
			.text("0")
			.attr("x", 2*margin.left+20)
			//.attr("dy", 12);
			.attr("fill", col("WOODARDS"))
			.style("font-size", "10px");
		var merrittStat = stats.append("tspan")
			.text("0")
			.attr("x", 2*margin.left+20)
			.attr("dy", 12)
			.attr("fill", col("MERRITT"))
			.style("font-size", "10px");
		var lopStat = stats.append("tspan")
			.text("0")
			.attr("x", 2*margin.left+20)
			.attr("dy", 12)
			.attr("fill", col("LOPEZ"))
			.style("font-size", "10px");



		function vertical() {
			var fmt = function(d) {
				if(d) {
					return "$" + d3.format(",.2f")(d);
				} else {
					return "";
				}
			};
			coords = d3.mouse(this)

			var xVal = x.range()[0] + margin.left+coords[0];
			var xDate = x.invert(coords[0]+margin.left);
			var i = bisectDate(data, xDate, 1),
				d0 = data[i-1],
				d1 = data[i];

			var nearest = xDate - d0.key > d1.key - xDate ? i : i-1;
			var nearDate = data[nearest].key;

			woodStat.text(fmt(data[nearest].value["WOODARDS"]));
			merrittStat.text(fmt(data[nearest].value["MERRITT"]));
			lopStat.text(fmt(data[nearest].value["LOPEZ"]));
			console.log(data[nearest]);


			overlayLine
				.attr("x1", x(nearDate)+margin.left)
				.attr("x2", x(nearDate)+margin.left);
		}

		var xAxis = d3.axisBottom().scale(x);
		var yAxis = d3.axisLeft().scale(y).ticks(5);

		var candidates = g.selectAll(".candidate")
							.data(names);

		var candidatesEnter = candidates.enter()
					.append("g")
					.attr("class", "city")
					.attr("id", function(d) { return d; });

		candidatesEnter.append("path")
						//.attr("class", "line")
						.attr("d", function(d) { return makeLine(d)(data); })
						.attr("stroke", function(d) { return col(d); })
						.attr("stroke-width", 2.5)
						.attr("fill", "none");

		var primary = new Date("2017-08-01 00:00:00");
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

		// PRIMARY LINE
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

		// ADDITIONAL NOTES

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
			.text("The two major candidates saw a donation");
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
			

		// PLOT LABELS
		g.append("text")
			.text("Tacoma Mayoral Candidates :: Donations by Month")
			.attr("x", margin.left + figWidth/2)
			.attr("text-anchor", "middle")
			.style("font-weight", "bold")
			.style("font-size", 18);

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

		// AXES
		g.append("g")
			.attr("class", "axis")
			.attr("transform", "translate(0, "+(margin.top + figHeight)+")")
			.call(xAxis);

		g.append("g")
			.attr("class", "axis")
			.attr("transform", "translate("+margin.left+",0)")
			.call(yAxis);
	}

	var public = {
		"plot": plot_,
		"data": data_
	};

	return public;
};



var rowConverter = function(d) {
	var timeParse = d3.timeParse("%m/%d/%Y %H:%M:%S %p")

	return {
		"receiptDate": timeParse(d["receipt_date"]),
		"lastName": d["last_name"],
		"amount": parseFloat(d["amount"].replace("$", ""))
	};
}


d3.csv("data/monthly.csv", rowConverter, function(monthly) {
	//console.log(monthly[0]["receiptDate"]);
	// Data processing
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

	monthlyNested.forEach(function(d) { d.key = new Date(d.key); });
	//console.log(monthlyNested.sort(function(a, b) { return new Date(a.key) - new Date(b.key); }));
	//monthlyNested.sort(function(a, b) { return new Date(a.key) - new Date(b.key); });
	monthlyNested.sort(function(a, b) { return a.key - b.key; });
	
	console.log(monthlyNested.filter(function(d) { return d.value["LOPEZ"] > 0; }));


	var myMayor = my_viz_lib.mayorPlot();
	myMayor.data(monthlyNested);
	myMayor.plot();

	
});
