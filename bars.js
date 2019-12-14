/* Note: For the following we consulted:
	http://learnjsdata.com/group_data.html
	https://bl.ocks.org/d3noob/7030f35b72de721622b8
*/

// Run Only After the Data is Loaded:
d3.csv("Complaints4Pareto.csv").then(function(data) {
	// ---------------------------------------------------------------
	// Make the SVG Element:
	h = 600;
	w = 1200;
	var padding = 50;

	var svg = d3.select("body")
		.append("svg")
		.attr("class", "bars-svg")
		.attr("width", w)
		.attr("height", h);

	// ---------------------------------------------------------------
	// Initialize Variables for Chart:
	initChart = 0; //this is the id# for the selected complaint
	levelChart = 4;
	
	// ---------------------------------------------------------------
	// Get Frequencies of Impressions for Each Complaint:
	var complaintImpressionCount = d3.nest()
		.key(function(d) { return d.complaint; })
		.key(function(d) { return d.impression; }).sortValues(d3.ascending)
		.rollup(function(v) { return v.length; })
		.sortValues(function(a,b) { return parseFloat(a.value) - parseFloat(b.value); })
		.entries(data);
	
	/* output from this is formatted:
	[{"key":complaint, "values":[
		{"key":impression, "value":frequency},
		{"key":impression, "value":frequency}]},
	{"key":complaint, "values":[
		{"key":impression, "value":frequency},
		{"key":impression, "value":frequency}]},
	{etc}
	]*/
	
	// ---------------------------------------------------------------
	// Select the Dataset to show Based on the Drop-Down Result:
	d3.select("select").on("change",function(d){ 
		bars_svg = d3.select(".bars-svg")
		bars_svg.selectAll("g").remove(); 
		bars_svg.selectAll("rect").remove();
		var selected = d3.select("#d3-dropdown").node().value;
		
		console.log("selection changed: "+selected);
		
		initChart = selected;
		updateData(initChart); 
		
		// Update the Chart Title:
		d3.select("#selected-dropdown").text(complaintImpressionCount[selected].key);
		/* Note:
			• # of Impressions for this Complaint = complaintImpressionCount[selected].values.length
			• Name of the Complaint = complaintImpressionCount[selected].key
			• The Data Itself = JSON.stringify(complaintImpressionCount[selected].values */
	})
	
	// ---------------------------------------------------------------
	//ADA DEBUG ----- why do we dissect complaintImpressionCount[initChart]?
	//			----- i see why that could be useful for brevity in code, but it's not used elsewhere.
	
	// Get Only the Values (impressions & frequencies) from the Selected Complaint's Data:
	var chartData = (complaintImpressionCount[initChart]).values;
	var test = d3.values(chartData).map(function(d) {return d.value;});
	//console.log("this is the test: " + test +", length="+test.length);

	// Make a List of Values (frequencies) to Determine the y-Scale:
	let valList = (chartData).map(({value}) => value);
	let valListSorted = valList.sort(function(a, b){return b-a});

	// Make a List of Keys (impressions):
	//ADA DEBUG ----- this isn't used anywhere but here
	let keysMap = (chartData).map(({ key }) => key);

	// ---------------------------------------------------------------
	// Scales & Bar Size Parameters:
	
	// Bar Width:
	//  = svg width - padding on both sides - 2px on each side - 2px between each bar
	var barWidth = (w - (2*padding) - 4 - ((valList.length-1)*2))/(valList.length-1);
	console.log("Bar Width: " + barWidth);
	
	// Bars Height Scale:
	var heightscale = d3.scaleLinear()
		.domain([0, d3.max(valList)]) // data values (frequencies)
		.range([0,h-(padding*2)]); // map to interior chart size
	
	// Bottom Axis (x):
	var xscale = d3.scaleLinear()
		.domain([0, valList.length]) //data values (bar numbers)
		.range([padding, w-padding*2-barWidth]); //map to chart horizontal edges
	var xAxis = d3.axisBottom()
		.scale(xscale)
		.ticks(0);
	//console.log("xscale test: 0->"+xscale(0)+", 51->"+xscale(51)+", 102->"+xscale(102));

	// Left Axis (y = frequency):
	var yscale = d3.scaleLinear()
		.domain([0, d3.max(valList)]) //data values (frequencies)
		.range([h-padding, padding]); //map to chart top & bottom
	var yAxis = d3.axisLeft()
		.scale(yscale)
		.ticks(10);

	/* unfortunately we ran out of time to implement the pareto line on our chart
	// Right Axis (y = percentage):
	var yrscale = d3.scaleLinear()
		.domain([0, 100]) //data values (percentage)
		.range([h-padding, padding]); //map to chart top & bottom
	var yAxisr = d3.axisRight()
		.scale(yrscale)
		.ticks(10);
	*/
	
	// ---------------------------------------------------------------
	// Make & Place Axis Labels:
	
	// X Axis Label:
	svg.append("text")             
		.attr("transform", "translate(" + (w/2) + " ," + (h-(padding/2)) + ")")
		.style("text-anchor", "middle")
		.text("Impression");
	// Call X Axis & Rotate Text Labels:
	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," +( h-padding) + ")")
		.call(xAxis)
		.selectAll("text")  
		.style("text-anchor", "end")
		.attr("dx", "2.8em")
		.attr("dy", "5.25em")
		.attr("transform", "rotate(-65)");
	// Add to SVG:
	svg.select('x axis')
		.attr("text-anchor", "end")
		.selectAll("text")
		.attr("transform", "rotate(-90)");

	// Left Axis Label (y = frequency):
	svg.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", -5)
		.attr("x",0 - ((h / 2)))
		.attr("dy", "1em")
		.style("text-anchor", "middle")
		.text("Frequency");
	// Add to SVG:
	svg.append("g")
		.attr("class", "y axis")
		.attr("transform", "translate(" + (padding) + ",0)")
		.call(yAxis);

	/*
	// Right Axis Label (y = percentage)
	svg.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", w -20)
		.attr("x",0 - (h / 2))
		.attr("dy", "1em")
		.style("text-anchor", "middle")
		.text("Percent");
	// Add to SVG:
	svg.append("g")
		.attr("class", "y axis")
		.attr("transform", "translate(  " + (w-padding) + ")")
		.call(yAxisr);
	*/
	
	// ---------------------------------------------------------------
	// Making the Bars for the Chart:
	svg.selectAll("rect")
		.data(valListSorted)
		.enter().append("rect")
		.style("fill", "steelblue")
		.attr("y", function(d) {return yscale(d);})
		.attr("x", function(d, i) {return xscale(i)+2;}) 
		.attr("height", function(d) {return heightscale(d);}) 
		.attr("width", barWidth);

	// ---------------------------------------------------------------
	// Update Graph When the Data Changes:
	function updateData(initChart){
		// ---------------------------------------------------------------
		// Dissect complaintImpressionCount[initChart] for kicks & to streamline later code
	
		// Get Only the Values (impressions & frequencies) from the Selected Complaint's Data:
		var chartData = (complaintImpressionCount[initChart]).values;

		// Make a List of Values (frequencies) to Determine the y-Scale:
		let valList = (chartData).map(({value}) => value);
		let valListSorted = valList.sort(function(a, b){return b-a});
		console.log("this is the sort: " + valListSorted);

		// ---------------------------------------------------------------
		// Scales & Bar Size Parameters:
	
		// Bar Width:
		//  = svg width - padding on both sides - 2px on each side - 2px between each bar
		var barWidth = (w - (2*padding) - 4 - ((valList.length-1)*2))/(valList.length-1);
		console.log("Bar Width: " + barWidth);
	
		// Bars Height Scale:
		var heightscale = d3.scaleLinear()
			.domain([0, d3.max(valList)]) // data values (frequencies)
			.range([0,h-(padding*2)]); // map to interior chart size
	
		// Bottom Axis (x):
		var xscale = d3.scaleLinear()
			.domain([0, valList.length]) //data values (bar numbers)
			.range([padding, w-padding*2-barWidth]); //map to chart horizontal edges
		var xAxis = d3.axisBottom()
			.scale(xscale)
			.ticks(0);

		// Left Axis (y = frequency):
		var yscale = d3.scaleLinear()
			.domain([0, d3.max(valList)]) //data values (frequencies)
			.range([h-padding, padding]); //map to chart top & bottom
		var yAxis = d3.axisLeft()
			.scale(yscale)
			.ticks(10);
	
		/*
		// Right Axis (y = percentage):
		var yrscale = d3.scaleLinear()
			.domain([0, 100]) //data values (percentage)
			.range([h-padding, padding]); //map to chart top & bottom
		var yAxisr = d3.axisRight()
			.scale(yrscale)
			.ticks(10);
		*/
		
		// ---------------------------------------------------------------
		// Make & Place Axis Labels:
		//ADA DEBUG ----- figure out how to dynamically add labels for the impressions
		
		// X Axis:
		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," +( h-padding) + ")")
			.call(xAxis)
		// Left Axis (y = frequency):
		svg.append("g")
			.attr("class", "y axis")
			.attr("transform", "translate(" + (padding) + ",0)")
			.call(yAxis);
		/*
		// Right Axis (y = percentage):
		svg.append("g")
			.attr("class", "y axis")
			.attr("transform", "translate(  " + (w-padding) + ")")
			.call(yAxisr);
		*/
		
		// ---------------------------------------------------------------
		// Making the Bars for the Chart:
		svg.selectAll("rect")
			.data(valListSorted)
			.enter().append("rect")
			.style("fill", "steelblue")
			.attr("y", function(d) {return yscale(d);})
			.attr("x", function(d, i) {return xscale(i)+2;}) 
			.attr("height", function(d) {return heightscale(d);}) 
			.attr("width", barWidth);	
	}

})