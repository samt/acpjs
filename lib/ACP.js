/*
 * ACP
 *
 * sometimes it's just a load a crud
 */

var express = require('express'),
  util = require('util'),
  EventEmitter = require('events').EventEmitter;

module.exports = function () {
  return new ACP();
};

function ACP() {
}

ACP.prototype.page = function (name, options) {
}

ACP.prototype.define = function (name, options) {
}

ACP.prototype.listen = function () {
  // apply the func arguments to an express app
}

util.inherits(ACP, EventEmitter);
