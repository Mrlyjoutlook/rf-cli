#!/usr/bin/env node

"use strict";

process.env.NODE_ENV = "development";

const paths = require("./utils/paths");
const rewireModule = require("./utils/rewireModule");
const compose = require("./utils/compose");

rewireModule(
  "react-scripts/scripts/start.js",
  compose(require(paths.configOverrides).webpack, require("../rf.default.js"))
);