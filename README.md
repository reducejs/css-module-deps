# css-module-deps
walk the css dependency graph to generate a stream of json output.

[![npm](https://nodei.co/npm/css-module-deps.png?downloads=true)](https://www.npmjs.org/package/css-module-deps)

[![version](https://img.shields.io/npm/v/css-module-deps.svg)](https://www.npmjs.org/package/css-module-deps)
[![status](https://travis-ci.org/zoubin/css-module-deps.svg?branch=master)](https://travis-ci.org/zoubin/css-module-deps)
[![coverage](https://img.shields.io/coveralls/zoubin/css-module-deps.svg)](https://coveralls.io/github/zoubin/css-module-deps)
[![dependencies](https://david-dm.org/zoubin/css-module-deps.svg)](https://david-dm.org/zoubin/css-module-deps)
[![devDependencies](https://david-dm.org/zoubin/css-module-deps/dev-status.svg)](https://david-dm.org/zoubin/css-module-deps#info=devDependencies)

## Related
* [depsify](https://github.com/zoubin/depsify)
* [reduce-css](https://github.com/zoubin/reduce-css)

## Example

```javascript
var Deps = require('..')
var postcss = require('postcss')
var atImport = require('postcss-import')
var url = require('postcss-url')
var vars = require('postcss-advanced-variables')
var JSONStream = require('JSONStream')
var path = require('path')

var fixtures = path.resolve.bind(path, __dirname, 'src')
var processor = postcss([
  atImport(),
  url(),
  vars(),
])

var stream = new Deps({
  basedir: fixtures(),
  processor: function (result) {
    return processor.process(result.css, { from: result.from, to: result.to })
      .then(function (res) {
        result.css = res.css
      })
  },
})
stream.write({ file: './import-url.css' })
stream.end({ file: './import-and-deps.css' })

stream.pipe(JSONStream.stringify()).pipe(process.stdout)

```

### Input

```
⌘ tree example/src
example/src
├── import-and-deps.css
├── import-url.css
└── node_modules
    ├── helper
    │   └── vars.css
    └── sprites
        └── dialog
            ├── index.css
            └── sp-dialog.png
```

import-and-deps.css:
```css
@deps "./import-url";
@import "helper/vars";

.import-and-deps {
  color: $red;
}

```

import-url.css
```css
@import "sprites/dialog";
.importUrl{}

```

helper/vars.css:
```css
$red: #FF0000;

```

sprites/dialog/index.css:
```css
.dialog {
  background: url(sp-dialog.png)
}

```

### Output

```
⌘ node example/deps.js
[
{"file":"/Users/zoubin/usr/src/zoubin/css-module-deps/example/src/import-url.css","source":".dialog {\n  background: url(node_modules/sprites/dialog/sp-dialog.png)\n}\n.importUrl{}\n\n","deps":{}}
,
{"file":"/Users/zoubin/usr/src/zoubin/css-module-deps/example/src/import-and-deps.css","source":".import-and-deps {\n  color: #FF0000;\n}\n\n","deps":{"./import-url":"/Users/zoubin/usr/src/zoubin/css-module-deps/example/src/import-url.css"}}
]

```

## stream = Deps(opts)

Return an object stream that expects `{ file: ... }` objects as input,
and produces objects for every dependency from a recursive module traversal as output.

### opts

#### resolve
Specify how to resolve a file path

Type: `Function`

Receives the string to be resolved, and an option object with `basedir`.

Should return a promise which resolves to the absolute path.


#### noParse
Specify which files to skip parsing.

Type: `Array`

Passed to [`multimatch`](https://github.com/sindresorhus/multimatch) to do matching.

#### atDeps
Specify the name of at-rules to declare a dependency

Type: `String`

Default: `deps`

Dependencies are declared through the `@deps` at-rule by default.

#### processor
Processors are used to transform each file in the dependency graph.

You can use [postcss](https://github.com/postcss/postcss), [node-sass](https://github.com/sass/node-sass), etc.

Type: `Function`, `Array`

Signature: `promise = fn(result)`

In case of synchronous processors, no need to return a promise.

`result` is an instance of `Result`.

See [Result](#result).


#### basedir

Type: `String`

Used to resolve input filenames.


### Result

`var r = new Result(row)`

Each row has the following fields:

* `file`: file path
* `source`: file contents

Read or modify `r.root` (the [AST object](https://github.com/postcss/postcss/blob/master/docs/api.md#root-node))
or `r.css` to do transformation.

Usually, you do not have to access both.

