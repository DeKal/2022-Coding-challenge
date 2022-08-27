

const WIDTH = 1200;
const HEIGHT = 800;

const LINE_X = 60;
const LINE_Y = 60;
const UNIT_WIDTH = WIDTH / LINE_X;
const UNIT_HEIGHT = HEIGHT / LINE_Y;

const url = "http://127.0.0.1:5501";

const fetchAPI = async () => {
	try {
		console.log("fetch ongoing");
		const response = await fetch(url);
		console.log("fetch done: ", response.data);
		return response.data;
	} catch (err) {
		console.log(err);
	}
};

let data1 = await fetchAPI();
console.log(data1)

const data = [
	{
		data: {
			incidents: [
				{
					id: 1,
					codeName: "Incident A",
					loc: { x: 18, y: 28 },
					officerId: 2,
				},
				{
					id: 2,
					codeName: "Incident B",
					loc: { x: 38, y: 5 },
					officerId: 1,
				},
			],
			officers: [
				{ id: 1, badgeName: "Minh 1", loc: { x: 50, y: 35 } },
				{ id: 2, badgeName: "Minh 2", loc: { x: 10, y: 20 } },
			],
		},
		error: null,
	},
];

const TOOLTIP_STYLE = new PIXI.TextStyle({
	fill: "white",
	fontSize: 16,
});

const app = new PIXI.Application({
	width: WIDTH,
	height: HEIGHT,
	backgroundColor: 0x000000,
});

document.getElementById("app").appendChild(app.view);

function drawMap() {
	const graphics = new PIXI.Graphics();

	graphics.lineStyle(1, 0x424242, 0.8);

	for (let i = 0; i < LINE_X; i++) {
		graphics.moveTo((i + 1) * UNIT_WIDTH, 0);
		graphics.lineTo((i + 1) * UNIT_WIDTH, HEIGHT);
	}

	for (let i = 0; i < LINE_Y; i++) {
		graphics.moveTo(0, (i + 1) * UNIT_HEIGHT);
		graphics.lineTo(WIDTH, (i + 1) * UNIT_HEIGHT);
	}

	graphics.closePath();
	app.stage.addChild(graphics);
}

function drawTooltip(text, graphics, x, y) {
	const tooltip = new PIXI.Text(text, TOOLTIP_STYLE);
	tooltip.x = x * UNIT_WIDTH;
	tooltip.y = y * UNIT_HEIGHT;
	tooltip.anchor = { x: 0.5, y: 1 };

	app.stage.addChild(tooltip);
}

function drawIncidents(incidents) {
	return incidents.map((incident) => {
		const graphics = new PIXI.Graphics();
		graphics.beginFill(0xbf360c, 1);
		graphics.drawCircle(
			incident.loc.x * UNIT_WIDTH,
			incident.loc.y * UNIT_HEIGHT,
			UNIT_WIDTH
		);

		graphics.alpha = Math.random();
		graphics.alphaDirection = 1;

		app.stage.addChild(graphics);

		drawTooltip(incident.codeName, graphics, incident.loc.x, incident.loc.y);

		return graphics;
	});
}

function drawOfficers(officers) {
	officers.forEach((officer) => {
		const graphics = new PIXI.Graphics();

		graphics.beginFill(0x37b218, 1);
		graphics.drawCircle(
			officer.loc.x * UNIT_WIDTH,
			officer.loc.y * UNIT_HEIGHT,
			UNIT_WIDTH / 2
		);

		app.stage.addChild(graphics);

		drawTooltip(officer.badgeName, graphics, officer.loc.x, officer.loc.y);
	});
}

function drawAssignLines(incidents, officers) {
	const graphics = new PIXI.Graphics();
	graphics.lineStyle(2, 0x37b218, 1);

	incidents.forEach((incident) => {
		const officer = officers.find((o) => o.id === incident.officerId);
		if (!officer) return;
		graphics.moveTo(incident.loc.x * UNIT_WIDTH, incident.loc.y * UNIT_HEIGHT);
		graphics.lineTo(officer.loc.x * UNIT_WIDTH, officer.loc.y * UNIT_HEIGHT);
	});

	app.stage.addChild(graphics);
}

let incidentGraphics = [];

function start() {
	app.ticker.add((delta) => {
		incidentGraphics.forEach((g) => {
			if (g.alpha >= 1) {
				g.alphaDirection = -1;
			}

			if (g.alpha <= 0.6) {
				g.alphaDirection = 1;
			}

			g.alpha += 0.005 * g.alphaDirection;
		});
	});

	loop();
	setInterval(loop, 5000);
}

async function loop() {
	try {
		const resp = await loadData();

		app.stage.removeChild(...app.stage.children);

		drawMap();

		const { incidents, officers } = resp.data;

		drawAssignLines(incidents, officers);
		drawOfficers(officers);
		incidentGraphics = drawIncidents(incidents);
	} catch (err) {
		console.error(err);
	}
}

const Incidents = data[0].data["incidents"];

const Officers = data[0].data["officers"];

const Error = data[0].error;

async function loadData() {
	return {
		data: {
			incidents: Incidents,
			officers: Officers,
		},
		error: Error || null,
	};
}

start();
