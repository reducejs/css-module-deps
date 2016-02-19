# css-module-deps
[![version](https://img.shields.io/npm/v/css-module-deps.svg)](https://www.npmjs.org/package/css-module-deps)
[![status](https://travis-ci.org/reducejs/css-module-deps.svg?branch=master)](https://travis-ci.org/reducejs/css-module-deps)
[![coverage](https://img.shields.io/coveralls/reducejs/css-module-deps.svg)](https://coveralls.io/github/reducejs/css-module-deps)
[![dependencies](https://david-dm.org/reducejs/css-module-deps.svg)](https://david-dm.org/reducejs/css-module-deps)
[![devDependencies](https://david-dm.org/reducejs/css-module-deps/dev-status.svg)](https://david-dm.org/reducejs/css-module-deps#info=devDependencies)
![node](https://img.shields.io/node/v/css-module-deps.svg)

Walk the css dependency graph to generate a stream of json output.

## Related
* [depsify](https://github.com/reducejs/depsify)
* [reduce-css](https://github.com/reducejs/reduce-css)
* [reduce-css-postcss](https://github.com/reducejs/reduce-css-postcss)

## Example

```javascript
var Deps = require('..')
var path = require('path')
var url = require('postcss-custom-url')
var atImport = require('postcss-simple-import')
var vars = require('postcss-advanced-variables')
var JSONStream = require('JSONStream')

var fixtures = path.resolve.bind(path, __dirname, 'src')

var stream = Deps({
  atRuleName: 'external',
  basedir: fixtures(),
  processor: [ atImport(), url(), vars() ],
})
stream.end({ file: './import-and-deps.css' })

stream.pipe(
  JSONStream.stringify(false, null, null, 2)
)
.pipe(process.stdout)

```

Directory structure:

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
@external "./import-url";
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

output:

```
⌘ node example/deps.js
{
  "file": "/Users/zoubin/usr/src/self/css-module-deps/example/src/import-url.css",
  "source": ".dialog {\n  background: url(node_modules/sprites/dialog/sp-dialog.png)\n}\n.importUrl{}\n\n",
  "deps": {},
  "id": "/Users/zoubin/usr/src/self/css-module-deps/example/src/import-url.css"
}
{
  "file": "/Users/zoubin/usr/src/self/css-module-deps/example/src/import-and-deps.css",
  "source": ".import-and-deps {\n  color: #FF0000;\n}\n\n",
  "deps": {
    "./import-url": "/Users/zoubin/usr/src/self/css-module-deps/example/src/import-url.css"
  },
  "id": "/Users/zoubin/usr/src/self/css-module-deps/example/src/import-and-deps.css"
}

```

## stream = Deps(opts)

Return an object stream that expects `{ file: ... }` objects as input,
and produces objects for every dependency from a recursive module traversal as output.

### opts

#### resolve
Specify how to resolve a file path

Type: `Function`

Receives the string to be resolved, and an option object with `basedir`.

Should return a promise, or the absolute path.


#### noParse
Specify which files to skip parsing.

Type: `Array`

Passed to [`multimatch`](https://github.com/sindresorhus/multimatch) to do matching.

#### atRuleName
Specify the name of at-rules to declare a dependency.

Type: `String`

Default: `deps`

Dependencies are declared through the `@deps` at-rule by default.

#### transform
Used to transform each file in the dependency graph.

Type: `Function`, `Array`

Signature: `fn(result)`

Return a promise to make it asynchronous.

`result` is an instance of [`Result`](#result).

#### processor
Specify [`postcss`](https://github.com/postcss/postcss-scss)
plugins to transform css file contents.

Type: `Array`


#### basedir

Type: `String`

Used to resolve input filenames.

#### dependenciesFilter
To filter the resolved dependencies.

Type: `Function`

Signature: `var newDeps = dependenciesFilter(deps, file)`


### Result

`var r = new Result(row)`

Each row has the following fields:

* `file`: file path
* `source`: file contents

Read or modify `r.root` (the [AST object](https://github.com/postcss/postcss/blob/master/docs/api.md#root-node))
or `r.css` to do transformations.

Usually, you do not have to access both.

`r.from` is the file path.

`r` is an emitter.

### Events

#### stream.on('file', file => {})
Before `readFile` called.

#### stream.on('transform', (result, file) => {})
Before applying transforms.

`result` is an [`Result`](#result).

