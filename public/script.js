var width = 150,
height = 60;

var arc = d3.svg.arc()
.innerRadius(18)
.outerRadius(25)
.startAngle(0)
.endAngle(function(d) { return (d.value / d.size) * 2 * Math.PI; });

var defaultArc = d3.svg.arc()
.innerRadius(18)
.outerRadius(25)
.startAngle(0)
.endAngle(function(d) { return 100 * 2 * Math.PI; })

var features = #{features
  "danceability": 0.9,
  "energy": 0.5,
  "loudness": 0.3,
  "speechiness": 0.1,
  "acousticness": 0.7,
  "instrumentalness": 0.8,
  "liveness": 0.2,
  "valence": 0.4,
  "tempo": 1
}

for (var key in features) {
  fields = [{
    value: Math.round(features[key]*100),
    size: 100,
    label: "%"
  }];

  svg = d3.selectAll("div.mdc-list-item__end-detail#"+key).append("svg")
  .attr("width", width)
  .attr("height", height);

  field = svg.selectAll("div.mdc-list-item__end-detail#"+key)
  .data(fields)
  .enter().append("g")
  .attr("transform", function(d, i) { return "translate(" + (i * 2 + 1.25) / 6.5 * width + "," + height / 2 + ")"; })
  .attr("class", "field");

  field.append("path")
  .attr("class", "path path--background")
  .attr("d", defaultArc);

  path = field.append("path")
  .attr("class", "path path--foreground");

  label = field.append("text")
  .attr("class", "label")
  .attr("dy", ".35em");

  field
  .each(function(d) { d.previous = 0, d.value = d.value; });

  path.transition()
  .ease("elastic")
  .duration(6000)
  .attrTween("d", arcTween);

  label
  .text(function(d) { return d.value + d.label; });
  console.log(fields)
}

function arcTween(b) {
  var i = d3.interpolate({value: b.previous}, b);
  return function(t) {
    return arc(i(t));
  };
}
