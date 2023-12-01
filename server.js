const mysql = require('mysql');
const express = require('express');

const con = mysql.createConnection({
    host: "",
    user: "",
    password: "",
    database: ""
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected to the database.");
});


const app = express();

app.use(express.json());


app.use(function(request,response,next) {
    response.append("Access-Control-Allow-Origin","*");
    response.append("Access-Control-Allow-Methods","GET,PUT,POST,DELETE");
    response.append("Access-Control-Allow-Headers","Content-Type");
    response.append("Content-Type","application/json");
    next();
});

app.listen(8055,function() {
    console.log("Server is running on http://localhost:8055");
});

app.get('/', function(req, res) {
  res.send('You should open index.html from the folder');
});

// respond with "hello world" when a GET request is made to the homepage
app.get('/selectDeparturePoint', function(req, res) {
    const sql = "SELECT stop_area, stop_name FROM stops";
    con.query(sql, function (err, result) {
      if (err) throw err;
      res.send(result);
    });
});

app.get('/selectBusStop', function(req, res) {
    xD = JSON.stringify(req.query.busArea);
    const sql = `SELECT stop_name FROM stops where stop_area = ${xD}`;
    con.query(sql, function (err, result) {
      if (err) throw err;
      res.send(result);
    });
});

app.get('/getStopId', function(req, res) {
  stopName = JSON.stringify(req.query.stopName);
  console.log(stopName)
  const sql = `SELECT stop_id FROM stops where stop_name = ${stopName}`;
  con.query(sql, function (err, result) {
    if (err) throw err;
    res.send(result);
  });
});

app.get('/getTripId', function(req, res) {
  stopId = JSON.stringify(req.query.stopId);
  const sql = `SELECT trip_id FROM stop_times where stop_id = ${stopId}`;
  con.query(sql, function (err, result) {
    if (err) throw err;
    res.send(result);
  });
});

app.get('/getRouteId', function(req, res) {
  tripId = JSON.stringify(req.query.tripId);
  //console.log(tripId);
  const sql = `SELECT route_id FROM trips where trip_id = ${tripId}`;
  con.query(sql, function (err, result) {
    if (err) throw err;
    res.send(result);
  });
});

app.get('/getBusNumber', function(req, res) {
  routeId = JSON.stringify(req.query.routeId);
  //console.log(routeId);
  const sql = `SELECT route_short_name FROM routes where route_id = ${routeId}`;
  con.query(sql, function (err, result) {
    if (err) throw err;
    res.send(result);
  });
});

app.get('/getClosestStop', function(req, res) {
  lat = JSON.stringify(req.query.lat);
  lon = JSON.stringify(req.query.lon);
  console.log(lon, lat)
  //console.log(routeId);
  const sql = `SELECT stop_area, stop_name, stop_lat, stop_lon, SQRT(
    POW(69.1 * (stop_lat - ${lat}), 2) +
    POW(69.1 * (${lon} - stop_lon) * COS(stop_lon / 57.3), 2)) AS distance
FROM stops HAVING distance < 0.5 ORDER BY distance`;
  con.query(sql, function (err, result) {
    if (err) throw err;
    res.send(result);
  });
});

app.get('/getTime', function(req, res) {
  stopId = JSON.stringify(req.query.stopId);
  //console.log(routeId);
  const sql = `SELECT arrival_time FROM stop_times WHERE trip_id=${stopId}`;
  con.query(sql, function (err, result) {
    if (err) throw err;
    res.send(result);
  });
});
// app.post('/add', function(req, res) {
//     const sql = "INSERT INTO a_hehe (seat_id, email) VALUES ('" + req.body.id + "', '" + req.body.email + "')";
//     con.query(sql, function (err, result) {
//       if (err) throw err;
//       res.send(result);
//     });
// });