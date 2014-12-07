/*!
 * async
 * https://github.com/caolan/async
 *
 * Copyright 2010-2014 Caolan McMahon
 * Released under the MIT license
 */
/*jshint onevar: false, indent:4 */
/*global setImmediate: false, setTimeout: false, console: false */
(function () {

    var async = {};

    // global on the server, window in the browser
    var root, previous_async;

    root = this;
    if (root != null) {
      previous_async = root.async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    function only_once(fn) {
        var called = false;
        return function() {
            if (called) throw new Error("Callback was already called.");
            called = true;
            fn.apply(root, arguments);
        }
    }

    //// cross-browser compatiblity functions ////

    var _toString = Object.prototype.toString;

    var _isArray = Array.isArray || function (obj) {
        return _toString.call(obj) === '[object Array]';
    };

    var _each = function (arr, iterator) {
        if (arr.forEach) {
            return arr.forEach(iterator);
        }
        for (var i = 0; i < arr.length; i += 1) {
            iterator(arr[i], i, arr);
        }
    };

    var _map = function (arr, iterator) {
        if (arr.map) {
            return arr.map(iterator);
        }
        var results = [];
        _each(arr, function (x, i, a) {
            results.push(iterator(x, i, a));
        });
        return results;
    };

    var _reduce = function (arr, iterator, memo) {
        if (arr.reduce) {
            return arr.reduce(iterator, memo);
        }
        _each(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    };

    var _keys = function (obj) {
        if (Object.keys) {
            return Object.keys(obj);
        }
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////
    if (typeof process === 'undefined' || !(process.nextTick)) {
        if (typeof setImmediate === 'function') {
            async.nextTick = function (fn) {
                // not a direct alias for IE10 compatibility
                setImmediate(fn);
            };
            async.setImmediate = async.nextTick;
        }
        else {
            async.nextTick = function (fn) {
                setTimeout(fn, 0);
            };
            async.setImmediate = async.nextTick;
        }
    }
    else {
        async.nextTick = process.nextTick;
        if (typeof setImmediate !== 'undefined') {
            async.setImmediate = function (fn) {
              // not a direct alias for IE10 compatibility
              setImmediate(fn);
            };
        }
        else {
            async.setImmediate = async.nextTick;
        }
    }

    async.each = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        _each(arr, function (x) {
            iterator(x, only_once(done) );
        });
        function done(err) {
          if (err) {
              callback(err);
              callback = function () {};
          }
          else {
              completed += 1;
              if (completed >= arr.length) {
                  callback();
              }
          }
        }
    };
    async.forEach = async.each;

    async.eachSeries = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        var iterate = function () {
            iterator(arr[completed], function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed >= arr.length) {
                        callback();
                    }
                    else {
                        iterate();
                    }
                }
            });
        };
        iterate();
    };
    async.forEachSeries = async.eachSeries;

    async.eachLimit = function (arr, limit, iterator, callback) {
        var fn = _eachLimit(limit);
        fn.apply(null, [arr, iterator, callback]);
    };
    async.forEachLimit = async.eachLimit;

    var _eachLimit = function (limit) {

        return function (arr, iterator, callback) {
            callback = callback || function () {};
            if (!arr.length || limit <= 0) {
                return callback();
            }
            var completed = 0;
            var started = 0;
            var running = 0;

            (function replenish () {
                if (completed >= arr.length) {
                    return callback();
                }

                while (running < limit && started < arr.length) {
                    started += 1;
                    running += 1;
                    iterator(arr[started - 1], function (err) {
                        if (err) {
                            callback(err);
                            callback = function () {};
                        }
                        else {
                            completed += 1;
                            running -= 1;
                            if (completed >= arr.length) {
                                callback();
                            }
                            else {
                                replenish();
                            }
                        }
                    });
                }
            })();
        };
    };


    var doParallel = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.each].concat(args));
        };
    };
    var doParallelLimit = function(limit, fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [_eachLimit(limit)].concat(args));
        };
    };
    var doSeries = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.eachSeries].concat(args));
        };
    };


    var _asyncMap = function (eachfn, arr, iterator, callback) {
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        if (!callback) {
            eachfn(arr, function (x, callback) {
                iterator(x.value, function (err) {
                    callback(err);
                });
            });
        } else {
            var results = [];
            eachfn(arr, function (x, callback) {
                iterator(x.value, function (err, v) {
                    results[x.index] = v;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };
    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = function (arr, limit, iterator, callback) {
        return _mapLimit(limit)(arr, iterator, callback);
    };

    var _mapLimit = function(limit) {
        return doParallelLimit(limit, _asyncMap);
    };

    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachSeries(arr, function (x, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };
    // inject alias
    async.inject = async.reduce;
    // foldl alias
    async.foldl = async.reduce;

    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, function (x) {
            return x;
        }).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };
    // foldr alias
    async.foldr = async.reduceRight;

    var _filter = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.filter = doParallel(_filter);
    async.filterSeries = doSeries(_filter);
    // select alias
    async.select = async.filter;
    async.selectSeries = async.filterSeries;

    var _reject = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (!v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.reject = doParallel(_reject);
    async.rejectSeries = doSeries(_reject);

    var _detect = function (eachfn, arr, iterator, main_callback) {
        eachfn(arr, function (x, callback) {
            iterator(x, function (result) {
                if (result) {
                    main_callback(x);
                    main_callback = function () {};
                }
                else {
                    callback();
                }
            });
        }, function (err) {
            main_callback();
        });
    };
    async.detect = doParallel(_detect);
    async.detectSeries = doSeries(_detect);

    async.some = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (v) {
                    main_callback(true);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(false);
        });
    };
    // any alias
    async.any = async.some;

    async.every = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (!v) {
                    main_callback(false);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(true);
        });
    };
    // all alias
    async.all = async.every;

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                var fn = function (left, right) {
                    var a = left.criteria, b = right.criteria;
                    return a < b ? -1 : a > b ? 1 : 0;
                };
                callback(null, _map(results.sort(fn), function (x) {
                    return x.value;
                }));
            }
        });
    };

    async.auto = function (tasks, callback) {
        callback = callback || function () {};
        var keys = _keys(tasks);
        var remainingTasks = keys.length
        if (!remainingTasks) {
            return callback();
        }

        var results = {};

        var listeners = [];
        var addListener = function (fn) {
            listeners.unshift(fn);
        };
        var removeListener = function (fn) {
            for (var i = 0; i < listeners.length; i += 1) {
                if (listeners[i] === fn) {
                    listeners.splice(i, 1);
                    return;
                }
            }
        };
        var taskComplete = function () {
            remainingTasks--
            _each(listeners.slice(0), function (fn) {
                fn();
            });
        };

        addListener(function () {
            if (!remainingTasks) {
                var theCallback = callback;
                // prevent final callback from calling itself if it errors
                callback = function () {};

                theCallback(null, results);
            }
        });

        _each(keys, function (k) {
            var task = _isArray(tasks[k]) ? tasks[k]: [tasks[k]];
            var taskCallback = function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    _each(_keys(results), function(rkey) {
                        safeResults[rkey] = results[rkey];
                    });
                    safeResults[k] = args;
                    callback(err, safeResults);
                    // stop subsequent errors hitting callback multiple times
                    callback = function () {};
                }
                else {
                    results[k] = args;
                    async.setImmediate(taskComplete);
                }
            };
            var requires = task.slice(0, Math.abs(task.length - 1)) || [];
            var ready = function () {
                return _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            };
            if (ready()) {
                task[task.length - 1](taskCallback, results);
            }
            else {
                var listener = function () {
                    if (ready()) {
                        removeListener(listener);
                        task[task.length - 1](taskCallback, results);
                    }
                };
                addListener(listener);
            }
        });
    };

    async.retry = function(times, task, callback) {
        var DEFAULT_TIMES = 5;
        var attempts = [];
        // Use defaults if times not passed
        if (typeof times === 'function') {
            callback = task;
            task = times;
            times = DEFAULT_TIMES;
        }
        // Make sure times is a number
        times = parseInt(times, 10) || DEFAULT_TIMES;
        var wrappedTask = function(wrappedCallback, wrappedResults) {
            var retryAttempt = function(task, finalAttempt) {
                return function(seriesCallback) {
                    task(function(err, result){
                        seriesCallback(!err || finalAttempt, {err: err, result: result});
                    }, wrappedResults);
                };
            };
            while (times) {
                attempts.push(retryAttempt(task, !(times-=1)));
            }
            async.series(attempts, function(done, data){
                data = data[data.length - 1];
                (wrappedCallback || callback)(data.err, data.result);
            });
        }
        // If a callback is passed, run this as a controll flow
        return callback ? wrappedTask() : wrappedTask
    };

    async.waterfall = function (tasks, callback) {
        callback = callback || function () {};
        if (!_isArray(tasks)) {
          var err = new Error('First argument to waterfall must be an array of functions');
          return callback(err);
        }
        if (!tasks.length) {
            return callback();
        }
        var wrapIterator = function (iterator) {
            return function (err) {
                if (err) {
                    callback.apply(null, arguments);
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    async.setImmediate(function () {
                        iterator.apply(null, args);
                    });
                }
            };
        };
        wrapIterator(async.iterator(tasks))();
    };

    var _parallel = function(eachfn, tasks, callback) {
        callback = callback || function () {};
        if (_isArray(tasks)) {
            eachfn.map(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            eachfn.each(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.parallel = function (tasks, callback) {
        _parallel({ map: async.map, each: async.each }, tasks, callback);
    };

    async.parallelLimit = function(tasks, limit, callback) {
        _parallel({ map: _mapLimit(limit), each: _eachLimit(limit) }, tasks, callback);
    };

    async.series = function (tasks, callback) {
        callback = callback || function () {};
        if (_isArray(tasks)) {
            async.mapSeries(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            async.eachSeries(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.iterator = function (tasks) {
        var makeCallback = function (index) {
            var fn = function () {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            };
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        };
        return makeCallback(0);
    };

    async.apply = function (fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function () {
            return fn.apply(
                null, args.concat(Array.prototype.slice.call(arguments))
            );
        };
    };

    var _concat = function (eachfn, arr, fn, callback) {
        var r = [];
        eachfn(arr, function (x, cb) {
            fn(x, function (err, y) {
                r = r.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, r);
        });
    };
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        if (test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.whilst(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doWhilst = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            var args = Array.prototype.slice.call(arguments, 1);
            if (test.apply(null, args)) {
                async.doWhilst(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.until = function (test, iterator, callback) {
        if (!test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.until(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doUntil = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            var args = Array.prototype.slice.call(arguments, 1);
            if (!test.apply(null, args)) {
                async.doUntil(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.queue = function (worker, concurrency) {
        if (concurrency === undefined) {
            concurrency = 1;
        }
        function _insert(q, data, pos, callback) {
          if (!q.started){
            q.started = true;
          }
          if (!_isArray(data)) {
              data = [data];
          }
          if(data.length == 0) {
             // call drain immediately if there are no tasks
             return async.setImmediate(function() {
                 if (q.drain) {
                     q.drain();
                 }
             });
          }
          _each(data, function(task) {
              var item = {
                  data: task,
                  callback: typeof callback === 'function' ? callback : null
              };

              if (pos) {
                q.tasks.unshift(item);
              } else {
                q.tasks.push(item);
              }

              if (q.saturated && q.tasks.length === q.concurrency) {
                  q.saturated();
              }
              async.setImmediate(q.process);
          });
        }

        var workers = 0;
        var q = {
            tasks: [],
            concurrency: concurrency,
            saturated: null,
            empty: null,
            drain: null,
            started: false,
            paused: false,
            push: function (data, callback) {
              _insert(q, data, false, callback);
            },
            kill: function () {
              q.drain = null;
              q.tasks = [];
            },
            unshift: function (data, callback) {
              _insert(q, data, true, callback);
            },
            process: function () {
                if (!q.paused && workers < q.concurrency && q.tasks.length) {
                    var task = q.tasks.shift();
                    if (q.empty && q.tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    var next = function () {
                        workers -= 1;
                        if (task.callback) {
                            task.callback.apply(task, arguments);
                        }
                        if (q.drain && q.tasks.length + workers === 0) {
                            q.drain();
                        }
                        q.process();
                    };
                    var cb = only_once(next);
                    worker(task.data, cb);
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            },
            idle: function() {
                return q.tasks.length + workers === 0;
            },
            pause: function () {
                if (q.paused === true) { return; }
                q.paused = true;
            },
            resume: function () {
                if (q.paused === false) { return; }
                q.paused = false;
                // Need to call q.process once per concurrent
                // worker to preserve full concurrency after pause
                for (var w = 1; w <= q.concurrency; w++) {
                    async.setImmediate(q.process);
                }
            }
        };
        return q;
    };

    async.priorityQueue = function (worker, concurrency) {

        function _compareTasks(a, b){
          return a.priority - b.priority;
        };

        function _binarySearch(sequence, item, compare) {
          var beg = -1,
              end = sequence.length - 1;
          while (beg < end) {
            var mid = beg + ((end - beg + 1) >>> 1);
            if (compare(item, sequence[mid]) >= 0) {
              beg = mid;
            } else {
              end = mid - 1;
            }
          }
          return beg;
        }

        function _insert(q, data, priority, callback) {
          if (!q.started){
            q.started = true;
          }
          if (!_isArray(data)) {
              data = [data];
          }
          if(data.length == 0) {
             // call drain immediately if there are no tasks
             return async.setImmediate(function() {
                 if (q.drain) {
                     q.drain();
                 }
             });
          }
          _each(data, function(task) {
              var item = {
                  data: task,
                  priority: priority,
                  callback: typeof callback === 'function' ? callback : null
              };

              q.tasks.splice(_binarySearch(q.tasks, item, _compareTasks) + 1, 0, item);

              if (q.saturated && q.tasks.length === q.concurrency) {
                  q.saturated();
              }
              async.setImmediate(q.process);
          });
        }

        // Start with a normal queue
        var q = async.queue(worker, concurrency);

        // Override push to accept second parameter representing priority
        q.push = function (data, priority, callback) {
          _insert(q, data, priority, callback);
        };

        // Remove unshift function
        delete q.unshift;

        return q;
    };

    async.cargo = function (worker, payload) {
        var working     = false,
            tasks       = [];

        var cargo = {
            tasks: tasks,
            payload: payload,
            saturated: null,
            empty: null,
            drain: null,
            drained: true,
            push: function (data, callback) {
                if (!_isArray(data)) {
                    data = [data];
                }
                _each(data, function(task) {
                    tasks.push({
                        data: task,
                        callback: typeof callback === 'function' ? callback : null
                    });
                    cargo.drained = false;
                    if (cargo.saturated && tasks.length === payload) {
                        cargo.saturated();
                    }
                });
                async.setImmediate(cargo.process);
            },
            process: function process() {
                if (working) return;
                if (tasks.length === 0) {
                    if(cargo.drain && !cargo.drained) cargo.drain();
                    cargo.drained = true;
                    return;
                }

                var ts = typeof payload === 'number'
                            ? tasks.splice(0, payload)
                            : tasks.splice(0, tasks.length);

                var ds = _map(ts, function (task) {
                    return task.data;
                });

                if(cargo.empty) cargo.empty();
                working = true;
                worker(ds, function () {
                    working = false;

                    var args = arguments;
                    _each(ts, function (data) {
                        if (data.callback) {
                            data.callback.apply(null, args);
                        }
                    });

                    process();
                });
            },
            length: function () {
                return tasks.length;
            },
            running: function () {
                return working;
            }
        };
        return cargo;
    };

    var _console_fn = function (name) {
        return function (fn) {
            var args = Array.prototype.slice.call(arguments, 1);
            fn.apply(null, args.concat([function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (typeof console !== 'undefined') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _each(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            }]));
        };
    };
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        hasher = hasher || function (x) {
            return x;
        };
        var memoized = function () {
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (key in memo) {
                async.nextTick(function () {
                    callback.apply(null, memo[key]);
                });
            }
            else if (key in queues) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([function () {
                    memo[key] = arguments;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                      q[i].apply(null, arguments);
                    }
                }]));
            }
        };
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
      return function () {
        return (fn.unmemoized || fn).apply(null, arguments);
      };
    };

    async.times = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.map(counter, iterator, callback);
    };

    async.timesSeries = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.mapSeries(counter, iterator, callback);
    };

    async.seq = function (/* functions... */) {
        var fns = arguments;
        return function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([function () {
                    var err = arguments[0];
                    var nextargs = Array.prototype.slice.call(arguments, 1);
                    cb(err, nextargs);
                }]))
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        };
    };

    async.compose = function (/* functions... */) {
      return async.seq.apply(null, Array.prototype.reverse.call(arguments));
    };

    var _applyEach = function (eachfn, fns /*args...*/) {
        var go = function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            return eachfn(fns, function (fn, cb) {
                fn.apply(that, args.concat([cb]));
            },
            callback);
        };
        if (arguments.length > 2) {
            var args = Array.prototype.slice.call(arguments, 2);
            return go.apply(this, args);
        }
        else {
            return go;
        }
    };
    async.applyEach = doParallel(_applyEach);
    async.applyEachSeries = doSeries(_applyEach);

    async.forever = function (fn, callback) {
        function next(err) {
            if (err) {
                if (callback) {
                    return callback(err);
                }
                throw err;
            }
            fn(next);
        }
        next();
    };

    // Node.js
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = async;
    }
    // AMD / RequireJS
    else if (typeof define !== 'undefined' && define.amd) {
        define([], function () {
            return async;
        });
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());




















// chrome.runtime.onMessage.addListener(
//   function(request, sender, sendResponse) {
//     if (request.getData == 'all'){
//     	console.log("request receved " + request)
//     	Storage.getAllValues(function(obj){
//     		console.log(obj)
//     		sendResponse(obj);
//     	});
//     }
//   });




var Storage = (function(){
    "use strict";
    var local = chrome.storage.local;
    var sync = chrome.storage.sync;
    var array = Array.prototype;
    var stringify = JSON.stringify;
    var toString = Object.prototype.toString;

    var Util = {
        isString: function(str){
            if (toString.call(str).indexOf('String') !== -1){
                return true;
            }
            return false;
        },

        removeValueFromArray: function(arr, val){
            var index = arr.indexOf(val);
            var reduced_arr = [];
            var i,length;
            if (index !== -1){
                for (i = 0, length = arr.length ; i < length; ++i){
                    if (i !== index){
                        reduced_arr.push(arr[i]);
                    }
                }
            }
            if ( i === length){
                return reduced_arr;
            }
            return arr;
        },

        removeKeyFromObject: function(obj, key){
            var keys =  Object.keys(obj);
            var reduced_obj = {};
            var i,length;
            if (keys.length > 0 ){
                for (i = 0, length = keys.length ; i < length; ++i){
                    if (keys[i] !== key) {
                        reduced_obj[keys[i]] = obj[keys[i]]; 
                    }
                }
            }
            if ( i === length){
                return reduced_obj;
            }
            return obj;
        },

        getSizeInBytes: function(str){
            return encodeURIComponent(str).replace(/%[A-F\d]{2}/g,'x').length;
        },

        getSizeOfKeyValue: function(key, value) {
            var obj = {};
            var str;
            obj[key] = value;
            str = stringify(obj);
            return this.getSizeInBytes(str);
        },

        getSizeOfObject: function(obj){
            var size = 0;
            var keys = Object.keys(obj);
            for (var i = 0, length = keys.length; i < length; ++i){
                var key = keys[i];
                size += this.getSizeOfKeyValue(key, obj[key]);
            }
            return size;
        },

        stringifyKeys: function(obj){
            var keys =  Object.keys(obj);
            var newobj = {};
            var i,length;
            if (keys.length > 0 ){
                for (i = 0, length = keys.length ; i < length; ++i){
                    var key = keys[i];
                    var value = JSON.stringify(obj[keys[i]]);
                    newobj[key] = value;
                }
            }
            return newobj;
        },

        unstringifyKeys: function(obj){
            var keys =  Object.keys(obj);
            var newobj = {};
            var i,length;
            if (keys.length > 0 ){
                for (i = 0, length = keys.length ; i < length; ++i){
                    var key = keys[i];
                    var value = JSON.parse(obj[keys[i]]);
                    newobj[key] = value;
                }
            }
            return newobj;
        }
    };

    /**
    * Storage Prototype to get and set data 
    */
    var Storage = {
        Sync: {

            /* Total Bytes our app can store in sync mode */
            _QUOTA_BYTES: 102400, 

            /* Total Bytes per item . see chrome.storage documentation for more details */
            _QUOTA_ITEM: 8192,

            /*  Must be less than _QUOTA_ITEM */
            _FRAGMENT_SIZE: 8000,

            /*  Name of the key which will contain the parts info*/
            _fragment_key: "_fragmentedKeys",
            
            /* returns an object that contain all data in object form.*/
            getAllValues: function(callback){               
                sync.get(null, callback);
            },

            /* Output is same as chrome.storage.sync.get for more than 1 values . For values which are saved in fragmented form
                Take out the fragmented values. merge them with normal(under QUOTA Limit) values.
            */
            getValues: function(keys, callback){
                var self = this;

                /* Get the fragment value. This will tell whether there are partitions. */
                sync.get(this._fragment_key, function(objVal){
                    var val = objVal[self._fragment_key];
                    var parts = 0;
                    var i, length;
                    var keys_arr = Array.prototype.slice.call(keys,0);

                    /* save a copy of keys. Keep only those keys whose values are under QUOTA Limit*/
                    var small_subset_of_keys = Array.prototype.slice.call(keys,0);
                    var results = {};
                    var func_arr = [];

                    /* Fragment values must be an array of objects */
                    if (Array.isArray(val) && val.length > 0 ){
                        for(i = 0 , length = val.length; i < length; ++i){
                            if (keys_arr.indexOf(val[i].key ) != -1){

                                /* If found push in function array that will be called by async library */
                                (function(key){
                                    func_arr.push(function(async_callback){
                                        self.getValue(key, function(objVal){
                                            var newobj = {};
                                            newobj["key"] = key;
                                            newobj["value"] = objVal[key]
                                            async_callback(null, newobj);
                                        });
                                    });
                                })(val[i].key);

                                /* remove this key from small subset. Keep only those keys whose values are under QUOTA Limit*/
                                small_subset_of_keys = Util.removeValueFromArray(small_subset_of_keys,val[i].key );
                            }
                        }

                        if (func_arr.length > 0){
                            /* Get all the values. After completion simply merge the two results. */
                            async.parallel(func_arr, function(err, async_results){

                                /*Fragmented values are fetched. Get normal values.*/
                                sync.get(small_subset_of_keys, function(objVal){
                                    var i,j,length;
                                    var objVal_keys = Object.keys(objVal);
                                    for (i = 0, length = objVal_keys.length; i < length ;++i){
                                        results[objVal_keys[i]] = objVal[objVal_keys[i]];
                                    }

                                    /* Fragmented results ==> async_results . Merging in results*/
                                    for (j = 0, length = async_results.length; j < length ;++j){
                                        results[async_results[j]["key"]] = async_results[j]["value"];
                                    }

                                    callback(results);
                                    return;
                                });
                            });
                        } else {
                            /* If array is there but there is no key whose size is greater than QUOTA Limit*/

                            sync.get(keys, callback);
                        }
                    } else {
                        /* If fragment val is not array */
                        sync.get(keys, callback);
                    }
                });
            },

            /* output is same as chrome.storage.sync.get . But internally it merges the fragmented parts combine
            them for one key only.*/
            getValue: function(key, callback){

                if (!Util.isString(key)){
                    callback(new Error ("key should be string"));
                    return;
                }
                var self = this;

                /* Get the fragment value. This will tell whether there are partitions. */
                sync.get(this._fragment_key, function(objVal){
                    var val = objVal[self._fragment_key];
                    var parts = 0;
                    var i, length;
                    var parts_keys_array = [];
                    if (Array.isArray(val) && val.length > 0 ){
                        /* Key must be string */
                        if (Util.isString(key)) {
                            for(i = 0 , length = val.length; i < length; ++i){
                                if (val[i].key === key){
                                    parts = val[i].parts;
                                    break;
                                }
                            }
                            if (parts != 0){
                                for ( i = 0; i < parts; ++i){
                                    var key_string = key + '_' + i;
                                    parts_keys_array.push(key_string);
                                }
                                /* Getting the fragmented array by getting keys */
                                sync.get(parts_keys_array,onGetSegmentParts);
                            }
                            
                        }
                    } else {
                        /* if the value is not array */
                        sync.get(key, callback);
                    }
                });

                /* Fragmented values are returned . Now combine them.*/
                function onGetSegmentParts(val){
                    var str = '';
                    var object = {};
                    var valKeys = Object.keys(val);
                    for( var i = 0, length = valKeys.length; i < length;++i ){
                        str += val[valKeys[i]];
                    }
                    object[key] = str;
                    callback(object);
                }
            },

            setKey: function(key, value, callback){
                if (!Util.isString(key)){
                    callback (new Error ("key should be string"));
                    return;
                }
                var self = this;
                var sizeOfKeyValue = Util.getSizeOfKeyValue(key, value);
                this.getSpaceLeft(function(spaceLeft){
                    if (sizeOfKeyValue < spaceLeft){
                        if (sizeOfKeyValue < self._QUOTA_ITEM) {
                            var object = {};
                            object[key] = value;
                            sync.set(object, callback);
                            return;
                        } else if (sizeOfKeyValue < self._QUOTA_BYTES){
                            self.setFragmentValue(key,value,callback);
                            return;
                        } 
                    } 
                    callback(Error("Only "+ spaceLeft+ " BYTES is left. This variable has size "+ sizeOfKeyValue+ "  BYTES"));
                    
                }); 
            },

            getFragments: function(key,value){
                var parts_keys = [];
                var parts_values = [];
                var i;
                var size;
                var length;
                /* +3 is for separator and number after separator. if key is "key". it will be saved as "key_0"..."key_10".
                    QUOTA limit is for (key size + value size ). Not for alone value size.
                */
                var keySize = Util.getSizeInBytes(JSON.stringify(key)) + 3; 
                var chars_size = keySize;
                var next_chars_size = 0;
                var part = '';
                var parts_length;
                var object = {};

                /* Simply get the size of the each character and keep on adding till it reaches FRAGMENT SIZE.
                    After that make another array and repeat the process.
                */
                for(i = 0, size = 0,length = value.length; i < length-1; ++i) {
                    chars_size += Util.getSizeInBytes(value[i]);
                    part += value[i];
                    next_chars_size = chars_size + Util.getSizeInBytes(value[i+1]);

                    if (next_chars_size > this._FRAGMENT_SIZE){
                        parts_keys.push(key + '_' + parts_keys.length);
                        parts_values.push(part);

                        // reset values
                        chars_size = keySize;
                        next_chars_size = 0;
                        part = '';
                    }
                }

                /* add numbers in front of key */

                parts_keys.push(key + '_' + parts_keys.length);
                parts_values.push(part);

                /* If loop ever ran */
                if ( i === (length -1)) {
                    parts_length = parts_values.length;
                    parts_values[parts_length -1 ] = parts_values[parts_length -1 ] + value[length -1];
                }

                /* Save in an Object */
                for ( i = 0; i < parts_length; ++ i) {
                    object[parts_keys[i]] = parts_values[i];
                }

                return {
                    data :object,
                    parts: parts_length
                };

            },

            setFragmentValue: function(key, value, callback){

                var fragments = this.getFragments(key, value);
                sync.set(fragments.data, onSetKeys.bind(this));

                function onSetKeys(){
                    this.setFragmentKey(key, fragments.parts, callback);
                }
            },

            setFragmentKey: function(key, parts, callback){

                /* Get the fragment value. This will tell whether there are partitions. */
                sync.get(this._fragment_key,onGetFragmentedValues.bind(this));

                function onGetFragmentedValues(objVal){
                    var object, key_object;
                    var value = objVal[this._fragment_key];
                    if (Array.isArray(value) && value.length > 0) {
                        var _fragmentedKeys = [];
                        for ( var i = 0, length = value.length;i < length;++i) {
                            _fragmentedKeys.push(value[i].key);
                        }
                        // var _fragmentedKeys = value;
                        var index = _fragmentedKeys.indexOf(key);
                        if (index === -1) {
                            // _fragmentedKeys.push(key);
                            object = {};
                            key_object = {
                                "key" : key,
                                "parts": parts
                            };
                            value.push(key_object);
                            object[this._fragment_key] = value;
                            sync.set(object, callback);
                        } else {
                            var fragment = value[index];
                            fragment.parts = parts;
                            sync.set(fragment, callback);
                        }
                    } else {
                        object = {};
                        key_object = {
                            "key" : key,
                            "parts": parts
                        };
                        object[this._fragment_key] = [key_object];
                        sync.set(object, callback);
                    }
                    
                }
            },

            setKeys: function(object, callback){
                var keys = Object.keys(object);
                var i, length;
                var key, value;
                var func_arr = [];
                var object_to_save = object; 
                var self = this;
                for (i = 0 , length = keys.length; i < length; ++i){
                    key = keys[i];
                    value = object[key];
                    if (Util.getSizeInBytes(value) > this._QUOTA_ITEM){
                        object_to_save = Util.removeKeyFromObject(object_to_save, key);
                        (function(key, value){
                            func_arr.push(function(asyncCallback){
                                self.setKey(key,value,function(){
                                    asyncCallback(null,true);
                                });
                            });
                        })(key, value);
                    }
                }
                if (func_arr.length > 0) {
                    async.series(func_arr,function(err, results){
                        sync.set(object_to_save,callback);
                    });
                } else {
                    sync.set(object,callback);
                }
            },

            removeKey: function(key, callback){
                sync.remove(key, callback);
            },

            removeKeys: function(keys, callback){
                sync.remove(keys, callback);
            },

            removeAllKeys: function(callback){
                sync.clear(callback);
            },

            getSpaceLeft: function(callback){

                var self = this;
                this.getSpaceUsed(function(spaceUsed){
                    var spaceLeft;
                    spaceLeft = self._QUOTA_BYTES - spaceUsed;
                    return callback(spaceLeft);
                });
            },

            getSpaceUsed: function(callback){
                sync.getBytesInUse(callback);
            }

        },
        Local : {
            _QUOTA_BYTES: 5242880, 
            
            
            getAllValues: function(callback){
                local.get(null, callback);
            },

            getValues: function(keys, callback){
                local.get(keys, callback);
            },

            getValue: function(keys, callback){
                local.get(keys, callback);
            },

            setKey: function(key, value, callback){
                var object = {};
                object[key] = value;
                this.setKeys(object, callback);
            },

            setKeys: function(object, callback){
                local.set(object, callback);
            },

            removeKey: function(key, callback){
                local.remove(key, callback);
            },

            removeKeys: function(keys, callback){
                local.remove(keys, callback);
            },

            removeAllKeys: function(callback){
                local.clear(callback);
            },

            getSpaceLeft: function(callback){
                var self = this;
                this.getSpaceUsed(function(spaceUsed){
                    var spaceLeft;
                    spaceLeft = self._QUOTA_BYTES - spaceUsed;
                    return callback(spaceLeft);
                });
            },


            getSpaceUsed: function(callback){
                local.getBytesInUse(callback);
            }
        },

        syncOn: function(callback){
            var self = this;
            if (this.isSyncOn()){
                callback({'saved': 'Ok'});
                return;
            } else {
                self.Local.getAllValues(function(objVal){
                    var objValSize = Util.getSizeOfObject(objVal);
                    if (objValSize < self.Local._QUOTA_BYTES){
                        self.Sync.removeAllKeys(function(){
                            self.Sync.setKeys(objVal, function(){
                                self.SYNC = true;
                                callback({'saved': 'Ok'});
                            });
                        });
                    } else {
                        callback({'saved': 'Error'});
                    }
                    
                });         
            }
        },

        /* SYNC Flag*/
        SYNC : true,

        syncOff: function(){
            this.SYNC = false;
        },

        isSyncOn: function(){
            return this.SYNC;
        },

        setKey: function(key, value, callback){
            var object = {};
            object[key] = value;
            this.setKeys(object,callback);
        },

        setKeys: function(obj, callback){
            var object = Util.stringifyKeys(obj);
            var sizeOfObject = Util.getSizeOfObject(object);
            var self = this;
            var return_object = {};
            /* Get local storage space left . If not available raise an alert. BAD UI :( */
            this.Local.getSpaceLeft(function(spaceLeft){
                if (spaceLeft >  sizeOfObject){
                    self.Local.setKeys(object, function(){
                        /* Local saved. Now save in Sync */
                        if (self.isSyncOn()){
                            if (sizeOfObject < self.Sync._QUOTA_BYTES){
                                self.Sync.removeAllKeys(function(){
                                    self.Sync.setKeys(object, function(){
                                        /* return space left in Sync storage */
                                        return_object["saved"] = 'Ok';
                                        return_object["spaceSaved"] = sizeOfObject;
                                        callback(return_object);
                                    });
                                });
                            } else {
                                return_object["saved"] = 'Error';
                                return_object["spaceSaved"] = sizeOfObject;
                                callback(return_object);
                            }

                        } else {
                            return_object["saved"] = 'Ok';
                            return_object["spaceSaved"] = sizeOfObject;
                            callback(return_object);
                        }
                    });
                } else {
                    alert("You have too much data on notes. Extension Can't save more data.")

                }
            });
        },

        getValue: function(key, callback){
            if (this.isSyncOn()){
                this.Sync.getValue(key, onReturnValues);
            } else {
                this.Local.getValue(key, onReturnValues);
            }

            function onReturnValues(obj){
                var newobj = Util.unstringifyKeys(obj);
                callback(newobj);

            }

        },

        getValues: function(keys, callback){
            if (this.isSyncOn()){
                this.Sync.getValues(keys, onReturnValues);
            } else {
                this.Local.getValues(keys, onReturnValues);
            }

            function onReturnValues(obj){
                var newobj = Util.unstringifyKeys(obj);
                callback(newobj);

            }
        },

        getAllValues: function(callback){
            if (this.isSyncOn()){
                this.Sync.getAllValues(onReturnValues);
            } else {
                this.Local.getAllValues(onReturnValues);
            }

            function onReturnValues(obj){
                var newobj = Util.unstringifyKeys(obj);
                callback(newobj);

            }
        },

        removeKey: function(key, callback){
            var self = this;
            self.Local.removeKey(key, function(){
                self.Sync.removeKey(key, callback);
            });
        },

        removeKeys: function(keys, callback){
            var self = this;
            self.Local.removeKeys(keys, function(){
                self.Sync.removeKeys(keys, callback);
            });
        },

        removeAllKeys: function(callback){
            var self = this;
            self.Local.removeAllKeys(function(){
                self.Sync.removeAllKeys(callback);
            });
        },

        getSpaceLeft: function(callback){
            if (this.isSyncOn()){
                this.Sync.spaceLeft(function(spaceLeft){
                    callback(spaceLeft);
                });
            } else {
                this.Local.spaceLeft(function(spaceLeft){
                    callback(spaceLeft);
                });
            }
        },

        getSpaceUsed: function(callback){
            if (this.isSyncOn()){
                this.Sync.spaceUsed(function(spaceUsed){
                    callback(spaceUsed);
                });
            } else {
                this.Local.spaceUsed(function(spaceUsed){
                    callback(spaceUsed);
                });
            }
        }


    };
    var storage =  {
        syncOn: Storage.syncOn.bind(Storage),
        syncOff: Storage.syncOff.bind(Storage),
        isSyncOn: Storage.isSyncOn.bind(Storage),
        setKey: Storage.setKey.bind(Storage),
        setKeys: Storage.setKeys.bind(Storage),
        getValue: Storage.getValue.bind(Storage),
        getValues: Storage.getValues.bind(Storage),
        getAllValues: Storage.getAllValues.bind(Storage),
        getSpaceUsed: Storage.getSpaceUsed.bind(Storage),
        getSpaceLeft: Storage.getSpaceLeft.bind(Storage),
        removeKey: Storage.removeKey.bind(Storage),
        removeKeys: Storage.removeKeys.bind(Storage),
        removeAllKeys: Storage.removeAllKeys.bind(Storage)
    };

    if (typeof define === 'function' && define.amd) {
        define('storage', [], function() {
          return storage;
        });
    }

    return storage;
})();
