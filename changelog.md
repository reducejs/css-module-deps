<!-- 5b12840 1449204544000 -->

## [v2.1.0](https://github.com/zoubin/css-module-deps/commit/5b12840) (2015-12-04)

* [[`559bfd4`](https://github.com/zoubin/css-module-deps/commit/559bfd4)] Add `processor` option for postcss-plugins

* [[`e8a93f1`](https://github.com/zoubin/css-module-deps/commit/e8a93f1)] **Fix**: pass the `from` option when parse `result.root`

* [[`f5eb58c`](https://github.com/zoubin/css-module-deps/commit/f5eb58c)] Readme for `dependenciesFilter`

* [[`dd76ed9`](https://github.com/zoubin/css-module-deps/commit/dd76ed9)] CHANGELOG

## [v2.0.0](https://github.com/zoubin/css-module-deps/commit/1473cd7) (2015-12-03)

### Breaking changes

* `Deps` is no constructor anymore.
* `atDeps` is replaced by `atRuleName`
* `processor` is replaced by `transform`
* `noParse` only supports patterns.

### Commmits

* [[`d27e19d`](https://github.com/zoubin/css-module-deps/commit/d27e19d)] Refactor. Breaking changes.

    
    * Exports a normal function rather than a constructor
    * `atDeps` is deprecated by `atRuleName`
    * `processor` is deprecated by `transform`
    * `noParse` only supports [`multimatch`](https://github.com/sindresorhus/multimatch) inputs.

* [[`a337edf`](https://github.com/zoubin/css-module-deps/commit/a337edf)] Support `dependenciesFilter`.

    
    * Use ES5.
    * Add option `dependenciesFilter`. Allow to modify css dependency graph.
    * Change most of instance methods to private functions, so that they do not mess.

## [v1.1.0](https://github.com/zoubin/css-module-deps/commit/0b3dbbe) (2015-10-28)

* [[`723a795`](https://github.com/zoubin/css-module-deps/commit/723a795)] remove unused dependencies

* [[`a488ea8`](https://github.com/zoubin/css-module-deps/commit/a488ea8)] update task-tape

* [[`588e428`](https://github.com/zoubin/css-module-deps/commit/588e428)] add more tests, readme

* [[`f986fec`](https://github.com/zoubin/css-module-deps/commit/f986fec)] fix option processor, support arguments

* [[`8e50a8b`](https://github.com/zoubin/css-module-deps/commit/8e50a8b)] add test for option cache

* [[`29dd242`](https://github.com/zoubin/css-module-deps/commit/29dd242)] collect processors from upstream

* [[`5328489`](https://github.com/zoubin/css-module-deps/commit/5328489)] refactor code. run processors

* [[`ec9413f`](https://github.com/zoubin/css-module-deps/commit/ec9413f)] support option noParse

* [[`dcbd75d`](https://github.com/zoubin/css-module-deps/commit/dcbd75d)] fix test processor

## [v1.0.0](https://github.com/zoubin/css-module-deps/commit/53f03a4) (2015-10-20)

## [v0.0.2](https://github.com/zoubin/css-module-deps/commit/3318ce7) (2015-10-20)

* [[`df23f2a`](https://github.com/zoubin/css-module-deps/commit/df23f2a)] add `id` field

* [[`9004575`](https://github.com/zoubin/css-module-deps/commit/9004575)] keywords

* [[`0112fb3`](https://github.com/zoubin/css-module-deps/commit/0112fb3)] fix result

* [[`9493775`](https://github.com/zoubin/css-module-deps/commit/9493775)] walk css dependency graph

* [[`f436df1`](https://github.com/zoubin/css-module-deps/commit/f436df1)] Initial commit

