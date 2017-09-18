var height = 500;
var width = 800;
var margin = { top: 30, right: 60, bottom: 80, left: 60 };
var figWidth = width - margin.left - margin.right;
var figHeight = height - margin.top - margin.bottom;
var maxY = 30000;

var svg = d3.select("body").append("svg")
				.attr("height", height)
				.attr("width", width);

var g = svg.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");


var x = d3.scaleTime().range([margin.left, figWidth]);
var y = d3.scaleLinear().range([margin.top, margin.top+figHeight]);
var col = d3.scaleOrdinal(d3.schemeCategory10);

function makeLine(lastName) {
	return d3.line()
				//.curve(d3.curveBasis)
				.y(function(d) { return y(d.value[lastName]); })
				.defined(function(d) { return d.value[lastName]; })
				.x(function(d) { return x(new Date(d.key)); });
}

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
	//console.log(monthlyNested.sort(function(a, b) { return new Date(a.key) - new Date(b.key); }));
	monthlyNested.sort(function(a, b) { return new Date(a.key) - new Date(b.key); });
	
	console.log(monthlyNested.filter(function(d) { return d.value["LOPEZ"] > 0; }));

	var names = ["MERRITT", "WOODARDS", "LOPEZ"];

	x.domain(d3.extent(monthlyNested, function(d) { return new Date(d.key); }));
	y.domain([maxY, 0]);

	var xAxis = d3.axisBottom().scale(x);
	var yAxis = d3.axisLeft().scale(y).ticks(5);

	col.domain(names);

	var candidates = g.selectAll(".candidate")
						.data(names);

	var candidatesEnter = candidates.enter()
				.append("g")
				.attr("class", "city")
				.attr("id", function(d) { return d; });

	candidatesEnter.append("path")
					//.attr("class", "line")
					.attr("d", function(d) { return makeLine(d)(monthlyNested); })
					.attr("stroke", function(d) { return col(d); })
					.attr("stroke-width", 2.5)
					.attr("fill", "none");

	var primary = new Date("2017-08-01 00:00:00");
	candidatesEnter.append("text")
					.text(function(d) { return d; })
					// .attr("x", x(d3.max(
					// 	monthlyNested.filter(function(d) {

					// 	}), 
					// 	function(d) {
					// 		return new Date(d.key);
					// 	}
					// )))
					.attr("x", function(d) {
						// var filtered = monthlyNested.filter(function(name) {

						// });
						var filtered = monthlyNested.filter(function(mn) {
							return mn.value[d] > 0;
						});
						var max = d3.max(filtered, function(f) { return new Date(f.key); });
						return x(max) + 2;
					})
					//.attr("y", y.range()[1])
					.attr("y", function(d) {
						var filtered = monthlyNested.filter(function(mn) {
							return mn.value[d] > 0;
						});
						//var max = d3.max(filtered, function(f) { return f.value[d]; });
						var last = filtered[filtered.length-1].value[d];
						return y(last) + 4;
					})
					.attr("fill", function(d) { return col(d); })
					.style("font-size", 10);

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
		.style("font-size", 10);

	// PLOT LABELS
	g.append("text")
		.text("Tacoma Mayoral Candidates :: Donations by Month")
		.attr("x", width/2)
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
		.attr("x", width/2)
		.attr("y", height-(margin.bottom/2))
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
});