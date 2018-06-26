const EventEmitter = require("events").EventEmitter;
const execa = require("execa");
const chalk = require("chalk");
const debug = require("debug");
const prompts = require("prompts");
const fs = require("fs-extra");
const path = require("path");
const { merge, assign } = require("lodash/object");
const LoadPrompt = require("./LoadPrompt");
const fetchRemoteTemplate = require("./fetchRemoteTemplate");
const clearConsole = require("./utils/clearConsole");
const writeFileTree = require("./utils/writeFileTree");
const Queue = require("./utils/queue");
const { tmpRfTemplate, rfTemp } = require("./env/local-path");

module.exports = class Creator extends EventEmitter {
  constructor(name, context, promptModules) {
    super();
    this.name = name;
    this.context = context;
    this.injectedPrompts = []; // 添加功能
    this.promptCompleteCbs = []; // 编译回调函数
    const prompts = new LoadPrompt(this);
    promptModules.forEach(m => m(prompts));
  }

  async create() {
    const { answers, preset } = await this.prompt();
    const { context, name } = this;
    await this.generatorTemplate(answers.base.template);
    // generate package.json with plugin dependencies
    const pkg = assign(
      {
        name,
        version: "0.1.0",
        private: true,
        devDependencies: {}
      },
      preset.pkgFields
    );
    const config = {
      public_path: "",
      compiler_commons: []
    };
    const deps = Object.keys(preset.plugins);
    deps.forEach(dep => {
      pkg.devDependencies[dep] = preset.plugins[dep].version || "latest";
    });
    // edit rf.js file content according to answers
    let content = fs.readFileSync(
      process.cwd() + "/" + name + "/.rf.js",
      "utf8"
    );
    if (
      !content.match(/\/\/ @rf-cli-complete-begin/) ||
      !content.match(/\/\/ @rf-cli-complete-end/)
    ) {
      return false;
    }
    if (preset.configFile.length !== 0) {
      content = content.replace(
        /\/\/ @rf-cli-complete-begin([\s\S]*?)\/\/ @rf-cli-complete-end/gm,
        Buffer.from(...preset.configFile, "urf8")
      );
    }
    preset.cbs.forEach(cb => cb(process.cwd() + "/" + this.name));
    // overrides file
    const tempPkg = require(rfTemp + "/package.json");
    await writeFileTree(context, {
      "rf.js": content,
      "package.json": JSON.stringify(merge(tempPkg, pkg), null, 2)
    });
    // add features
    console.log(chalk.green("build OK!"));
    console.log(chalk.green("run your project!"));
  }

  // 提示选项
  async prompt() {
    await clearConsole();
    const promptQueue = new Queue(this.injectedPrompts);
    let preset = {
      configFile: [], // .rf.js compiling content
      plugins: [], // pkg dependencies/devDependencies fields
      pkgFields: {}, // pkg all fields
      cbs: []
    };
    const answers = {
      base: {},
      complete: [],
      features: []
    };
    const num = promptQueue.size();
    for (let i = 0; i < num; i++) {
      const p = promptQueue.shift();
      const result = await prompts(p.prompt);
      if (p.type === "complete") {
        Array.isArray(result.value)
          ? answers.complete.push(...result.value)
          : answers.complete.push(result.value);
      } else if (p.type === "features") {
        if (result.value) {
          answers.features.push(result.value);
        }
      } else {
        answers.base[p.type] = result.value;
      }
    }
    this.promptCompleteCbs.forEach(cb => cb(answers, preset));

    debug("rf-cli:answers")(answers);
    debug("rf-cli:preset")(preset);

    return {
      answers,
      preset
    };
  }

  async generatorTemplate(temp) {
    const bool = true; //await fetchRemoteTemplate(fs.existsSync(tmpRfTemplate));
    if (bool) {
      try {
        console.log(chalk.cyan("now, generator template form rf-template."));
        await fs.copySync(
          path.join(tmpRfTemplate, "/packages/rf-template"),
          process.cwd() + "/" + this.name
        );
        await fs.move(
          process.cwd() + "/" + this.name + "/template/" + temp,
          process.cwd() + "/" + this.name + "/src",
          { overwrite: true }
        );
        await fs.remove(process.cwd() + "/" + this.name + "/template");
      } catch (error) {
        console.log(chalk.red("generator template fail", error));
        throw error;
      }
    }
  }

  // run command
  run(command, args) {
    if (!args) {
      [command, ...args] = command.split(/\s+/);
    }
    return execa(command, args, { cwd: this.context });
  }
};
