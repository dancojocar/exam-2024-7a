var koa = require('koa');
var app = module.exports = new koa();
const server = require('http').createServer(app.callback());
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });
const Router = require('koa-router');
const cors = require('@koa/cors');
const bodyParser = require('koa-bodyparser');

app.use(bodyParser());

app.use(cors());

app.use(middleware);

function middleware(ctx, next) {
  const start = new Date();
  return next().then(() => {
    const ms = new Date() - start;
    console.log(`${start.toLocaleTimeString()} ${ctx.response.status} ${ctx.request.method} ${ctx.request.url} - ${ms}ms`);
  });
}

const activities = [
  { id: 1, name: "Sports Day", date: "2024-05-15", details: "Annual sports event for students", status: "upcoming", participants: 200, type: "sports" },
  { id: 2, name: "Science Fair", date: "2024-03-22", details: "Showcasing innovative science projects", status: "completed", participants: 50, type: "academic" },
  { id: 3, name: "Music Concert", date: "2024-04-10", details: "Performance by school music bands", status: "pending", participants: 100, type: "cultural" },
  { id: 4, name: "Debate Competition", date: "2024-03-28", details: "Inter-school debate with various topics", status: "completed", participants: 30, type: "academic" },
  { id: 5, name: "Art Exhibition", date: "2024-05-05", details: "Showcasing students' artistic creations", status: "upcoming", participants: 80, type: "cultural" },
  { id: 6, name: "Math Olympiad", date: "2024-04-15", details: "Mathematics competition for students", status: "completed", participants: 40, type: "academic" },
  { id: 7, name: "Drama Performance", date: "2024-04-25", details: "Stage play presented by drama club", status: "upcoming", participants: 25, type: "cultural" },
  { id: 8, name: "Field Trip", date: "2024-05-20", details: "Educational excursion to a science museum", status: "pending", participants: 60, type: "academic" },
  { id: 9, name: "Chess Tournament", date: "2024-03-18", details: "Inter-school chess competition", status: "completed", participants: 20, type: "sports" },
  { id: 10, name: "Annual Gala Dinner", date: "2024-05-30", details: "Celebration of academic and cultural achievements", status: "upcoming", participants: 150, type: "cultural" },
  { id: 11, name: "Robotics Workshop", date: "2024-04-08", details: "Hands-on learning experience in robotics", status: "completed", participants: 35, type: "academic" },
  { id: 12, name: "Film Festival", date: "2024-05-12", details: "Screening of student-made films", status: "upcoming", participants: 70, type: "cultural" },
];


const router = new Router();

router.get('/activities', ctx => {
  ctx.response.body = activities;
  ctx.response.status = 200;
});

router.get('/participation', ctx => {
  ctx.response.body = activities.filter(entry => entry.status != "completed");
  ctx.response.status = 200;
});

router.get('/types', ctx => {
  ctx.response.body = activities.map(entry => entry.type);
  ctx.response.status = 200;
});

router.get('/activity/:id', ctx => {
  // console.log("ctx: " + JSON.stringify(ctx));
  const headers = ctx.params;
  // console.log("body: " + JSON.stringify(headers));
  const id = headers.id;
  if (typeof id !== 'undefined') {
    const index = activities.findIndex(entry => entry.id == id);
    if (index === -1) {
      const msg = "No entity with id: " + id;
      console.log(msg);
      ctx.response.body = { text: msg };
      ctx.response.status = 404;
    } else {
      let entry = activities[index];
      ctx.response.body = entry;
      ctx.response.status = 200;
    }
  } else {
    ctx.response.body = { text: 'Id missing or invalid' };
    ctx.response.status = 404;
  }
});

const broadcast = (data) =>
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });

router.post('/activity', ctx => {
  // console.log("ctx: " + JSON.stringify(ctx));
  const headers = ctx.request.body;
  // console.log("body: " + JSON.stringify(headers));
  const name = headers.name;
  const date = headers.date;
  const details = headers.details;
  const status = headers.status;
  const participants = headers.participants;
  const type = headers.type;
  if (typeof name !== 'undefined'
    && typeof date !== 'undefined'
    && typeof details !== 'undefined'
    && typeof status !== 'undefined'
    && typeof participants !== 'undefined'
    && typeof type !== 'undefined') {
    const index = activities.findIndex(entry => entry.name == name && entry.date == date);
    if (index !== -1) {
      const msg = "The entity already exists!";
      console.log(msg);
      ctx.response.body = { text: msg };
      ctx.response.status = 404;
    } else {
      let maxId = Math.max.apply(Math, activities.map(entry => entry.id)) + 1;
      let entry = {
        id: maxId,
        name,
        date,
        details,
        status,
        participants,
        type
      };
      activities.push(entry);
      broadcast(entry);
      ctx.response.body = entry;
      ctx.response.status = 200;
    }
  } else {
    const msg = "Missing or invalid name: " + name + " date: " + date + " details: " + details
      + " status: " + status + " participants: " + participants + " type: " + type;
    console.log(msg);
    ctx.response.body = { text: msg };
    ctx.response.status = 404;
  }
});

router.put('/register/:type', ctx => {
  const headers = ctx.params;
  const type = headers.type;
  if (typeof type !== 'undefined') {
    const index = activities.findIndex(entry => entry.type == type);
    if (index === -1) {
      //create new entry
      const msg = "No entity with type: " + type;
      console.log(msg);
      ctx.response.body = { text: msg };
      ctx.response.status = 404;
    } else {
      let entry = activities[index];
      entry.participants++;
      ctx.response.body = entry;
      ctx.response.status = 200;
    }
  } else {
    const msg = "Type missing or invalid. type: " + type;
    console.log(msg);
    ctx.response.body = { text: msg };
    ctx.response.status = 404;
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

const port = 2407;

server.listen(port, () => {
  console.log(`🚀 Server listening on ${port} ... 🚀`);
});