const data = {
	nodes: [
		{ id: 1, name: "OEM-PM" },
		{ id: 2, name: "OEM-PJM" },
		{ id: 3, name: "OEM-FW" },
		{ id: 4, name: "OEM-HW" },
		{ id: 5, name: "OEM-SW" },
		{ id: 6, name: "OEM-PV" },
		{ id: 7, name: "RDC-3A" },
		{ id: 8, name: "RDC-VP" },
		{ id: 9, name: "RDC-AI" },
		{ id: 10, name: "RDC-ME" },
	],
	links: [
		{ source: 1, target: 2 },
		{ source: 1, target: 3 },
		{ source: 1, target: 4 },
		{ source: 1, target: 5 },
		{ source: 1, target: 6 },
		{ source: 1, target: 7 },
		{ source: 1, target: 8 },
		{ source: 1, target: 9 },
		{ source: 1, target: 10 },
		{ source: 2, target: 3 },
		{ source: 2, target: 4 },
		{ source: 2, target: 5 },
		{ source: 2, target: 6 },
		{ source: 2, target: 7 },
		{ source: 2, target: 8 },
		{ source: 2, target: 9 },
		{ source: 2, target: 10 },
		{ source: 3, target: 4 },
		{ source: 3, target: 5 },
		{ source: 3, target: 6 },
		{ source: 3, target: 7 },
		{ source: 3, target: 8 },
		{ source: 3, target: 9 },
		{ source: 4, target: 6 },
		{ source: 4, target: 10 },
		{ source: 5, target: 6 },
		{ source: 6, target: 7 },
		{ source: 6, target: 8 },
		{ source: 6, target: 9 },
	],
};

const colorMap = {
	"OEM-PM": "#ff9900",
	"OEM-PJM": "#0099ff",
	"OEM-FW": "#ff3399",
	"OEM-HW": "#33cc33",
	"OEM-SW": "#9966ff",
	"OEM-PV": "#ff6600",
	"RDC-3A": "#ff0000",
	"RDC-VP": "#00ff00",
	"RDC-AI": "#0055ff",
	"RDC-ME": "#ffff00",
};

const svg = d3.select("#graph");
let width, height;

function updateSVGSize() {
	width = window.innerWidth;
	height = window.innerHeight;
	svg.attr("width", width).attr("height", height);
}

updateSVGSize();

window.addEventListener("resize", () => {
	updateSVGSize();
	if (simulation) {
		simulation
			.force("center", d3.forceCenter(width / 2, height / 2))
			.alpha(0.3)
			.restart();
	}
});

// 計算基礎圓圈半徑
const baseRadius = 20;

// 創建一個臨時的 SVG 文本元素來測量文本寬度
const tempText = svg.append("text").attr("visibility", "hidden");

// 計算最長文本的寬度
const maxTextWidth = d3.max(data.nodes, (d) => {
	tempText.text(d.name);
	return tempText.node().getComputedTextLength();
});

// 移除臨時文本元素
if (tempText) {
    tempText.remove();
} else {
    console.error("tempText is not defined or does not exist.");
}

// 計算圓圈半徑，確保最長的文本能夠容納在圓圈內
const circleRadius = Math.max(baseRadius, maxTextWidth / 2 + 10); // 加10作為內邊距
// 根據圓圈半徑計算適當的排斥力和連接距離
const repulsionStrength = -100 * circleRadius; // 排斥力與圓圈半徑成正比
const linkDistance = circleRadius * 4; // 連接距離為圓圈直徑的兩倍

const simulation = d3
	.forceSimulation(data.nodes)
	.force(
		"link",
		d3
			.forceLink(data.links)
			.id((d) => d.id)
			.distance(linkDistance)
	)
	.force("charge", d3.forceManyBody().strength(repulsionStrength))
	.force("center", d3.forceCenter(width / 2, height / 2))
	.force("collision", d3.forceCollide().radius(circleRadius + 5));

const link = svg
	.append("g")
	.selectAll("line")
	.data(data.links)
	.join("line")
	.attr("class", "link")
	.attr("stroke-width", 1); // 設置默認線寬

const node = svg
	.append("g")
	.selectAll("g")
	.data(data.nodes)
	.join("g")
	.attr("class", "node")
	.call(
		d3
			.drag()
			.on("start", dragstarted)
			.on("drag", dragged)
			.on("end", dragended)
	);

node.append("circle")
	.attr("r", circleRadius)
	.attr("fill", (d) => colorMap[d.name] || "#69b3a2");

node.append("text")
	.text((d) => d.name)
	.attr("text-anchor", "middle")
	.attr("dy", ".35em");

let selectedNode = null;

node.on("click", function (event, d) {
	if (selectedNode) {
		d3.select(selectedNode)
			.select("circle")
			.transition()
			.duration(300)
			.attr("r", circleRadius);

		// 恢復默認線寬和顏色
		link.transition()
			.duration(300)
			.attr("stroke-width", 1);
	}

	if (selectedNode === this) {
		selectedNode = null;
	} else {
		d3.select(this)
			.select("circle")
			.transition()
			.duration(300)
			.attr("r", circleRadius * 1.5);

		// 加粗與選中節點相連的連接線
		link.transition()
			.duration(300)
			.attr("stroke-width", (l) =>
				l.source === d || l.target === d ? 6 : 1
			);

		selectedNode = this;
	}
})
	.on("mouseover", function () {
		if (this !== selectedNode) {
			d3.select(this)
				.select("circle")
				.transition()
				.duration(300)
				.attr("r", circleRadius * 1.5);
		}
	})
	.on("mouseout", function () {
		if (this !== selectedNode) {
			d3.select(this)
				.select("circle")
				.transition()
				.duration(300)
				.attr("r", circleRadius);
		}
	});

simulation.on("tick", () => {
	link.attr("x1", (d) => d.source.x)
		.attr("y1", (d) => d.source.y)
		.attr("x2", (d) => d.target.x)
		.attr("y2", (d) => d.target.y);

	node.attr("transform", (d) => `translate(${d.x},${d.y})`);
});

function dragstarted(event, d) {
	if (!event.active) simulation.alphaTarget(0.3).restart();
	d.fx = d.x;
	d.fy = d.y;
}

function dragged(event, d) {
	d.fx = event.x;
	d.fy = event.y;
}

function dragended(event, d) {
	if (!event.active) simulation.alphaTarget(0);
	d.fx = null;
	d.fy = null;
}

simulation.alpha(0.3).restart();
