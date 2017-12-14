
var http = require('http');
var url = require('url');
var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var sql = require("mssql");
var dialog = require("dialog");
var ejs = require('ejs');
const child_process = require('child_process');
var ps = require('ps-node');
var fs = require('fs');
var app = express();
var os = require('os-utils');


var config = {
    user: "C3DCombiner",
    password: "c3dcombiner",
    server: "localhost",
    database: "C3DCombiner",
};



var usuarioActual;
var idUsuarioActual;
var nombreUsuarioActual;

app.use('/bower_components', express.static('bower_components'));
app.use('/plugins', express.static('plugins'));
app.use('/dist', express.static('dist'));
app.use('/build', express.static('build'));
app.use(bodyParser.urlencoded({ extended: true }));

app.set('views', __dirname + '/');
app.engine('html', ejs.renderFile);
app.set('view engine', 'html');


var server = app.listen(1993, function () {
    console.log('Servidor funcionando');
});


app.get('/', function (req, res) {
    if (usuarioActual == undefined) {
        res.render("index.html", { mensaje: "Bienvendio", usuario: "" });
    } else {
        res.redirect('/SO1');
    }
});

app.post('/', function (req, res) {
    var usuario = req.body.inUsuario.trim();
    var clave = req.body.inClave.trim();

    var conn = new sql.ConnectionPool(config);
    var req = new sql.Request(conn);

    usuarioActual = undefined;
    idUsuarioActual = undefined;
    nombreUsuarioActual = undefined;

    if (usuario == 'admin' && clave == 'admin') {
        usuarioActual = usuario;
        idUsuarioActual = 'admin';
        nombreUsuarioActual = 'admin';
        res.redirect('/SO1');
    } else {
        res.render('index.html', { mensaje: "Usuario y/o contraseña incorrecta", usuario: usuario });
    }
});

app.get('/SO1', function (req, res) {
    if (usuarioActual == undefined) {
      res.redirect('/');
    } else {
      child_process.exec('ps -A -o pid,user,state,%mem,command', (err, stdout, stdin) => {
        if (err) console.log(err);
        var jsonArr = [];
        var lines = stdout.split("\n");
        for (var i = 1; i < lines.length; i++) {
          var line = lines[i].trim();
          var pid = line.split(" ")[0];
          line = line.substring(pid.length, line.length).trim();
          var user = line.split(" ")[0];
          line = line.substring(user.length, line.length).trim();
          var state = line.split(" ")[0];
          line = line.substring(state.length, line.length).trim();
          var mem = line.split(" ")[0];
          line = line.substring(mem.length, line.length).trim();
          var command = line;
          jsonArr.push({"pid":pid, "user":user, "state":state, "mem":mem, "name":command});
        }

        var running = 0;
        var unsleep = 0;
        var insleep = 0;
        var zombie = 0;
        var stopped = 0;

        for(var i = 0; i < jsonArr.length; i++){
          switch(jsonArr[i].state.toLowerCase()){
            case 'r':
                running++;
              break;

            case 'd':
                unsleep++;
              break;

            case 's':
                insleep++;
              break;

            case 'z':
                zombie++;
              break;

            case 't':
                stopped++;
              break;
          }
        }
        var t = running + unsleep + insleep + zombie + stopped;
        var val = [];
        val.push({"total":t ,"r":running, "d":unsleep, "s":insleep, "z":zombie, "t":stopped});
        res.render("SO1.html", {datos:jsonArr, usuario: usuarioActual, nombre: nombreUsuarioActual, val:val});
      });

    }
});


app.get('/logout', function (req, res) {
    usuarioActual = undefined;
    idUsuarioActual = undefined;
    nombreUsuarioActual = undefined;

    res.redirect('/');
});

app.get('/eliminar', function (req, res) {
    var idProceso = req.query['id'];

    var conn = new sql.ConnectionPool(config);
    var req = new sql.Request(conn);

    console.log(idProceso);

    ps.kill( idProceso, function( err ) {
        if (err) {
            throw new Error( err );
        }
        else {
            console.log( 'Process %s has been killed!', idProceso);
            res.redirect('/SO1');
        }
    });
});

app.get('/cpuValue', function(req, res){
  os.cpuUsage(function(value){
    res.json(value);
  });
});

app.get('/cpuInfo', function(req, res){
  if (usuarioActual == undefined) {
    res.redirect('/');
  } else {
    res.render("cpuInfo.html", {usuario: usuarioActual, nombre: nombreUsuarioActual});
  }
});


app.get('/freeMemValue', function(req, res){
  res.json(os.freemem());
});

app.get('/totalMemValue', function(req, res){
  res.json(os.totalmem());
});

app.get('/memInfo', function(req, res){
  if (usuarioActual == undefined) {
    res.redirect('/');
  } else {
    res.render("memInfo.html", {usuario: usuarioActual, nombre: nombreUsuarioActual});
  }
});
