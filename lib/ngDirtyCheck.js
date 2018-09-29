(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.dirtyCheck = factory());
}(this, (function () { 'use strict';

	// tools

	function isDefined(value) {
		return typeof value !== 'undefined';
	}

	function isObject(value) {
		return value !== null && typeof value === 'object';
	}

	function isBlankObject(value) {
		return value !== null && typeof value === 'object' && isFunction(Object.getPrototypeOf) && !Object.getPrototypeOf(value);
	}

	function isPlainObject(value) {
		return value !== null && toString.call(value) === '[object Object]';
	}

	function isString(value) {
		return typeof value === 'string';
	}

	function isNumber(value) {
		return typeof value === 'number';
	}

	function isDate(value) {
		return toString.call(value) === '[object Date]';
	}

	function isArray(arr) {
		return arr instanceof Array;
	}

	function isFunction(value) {
		return typeof value === 'function';
	}

	function isRegExp(value) {
		return toString.call(value) === '[object RegExp]';
	}

	function isWindow(obj) {
		return obj && obj.window === obj;
	}

	function arrayRemove(array, value) {
		var index = array.indexOf(value);
		if (index >= 0) {
			array.splice(index, 1);
		}
		return index;
	}

	function isArrayLike(obj) {

		// `null`, `undefined` and `window` are not array-like
		if (obj == null || isWindow(obj)) return false;

		// arrays, strings and jQuery/jqLite objects are array like
		// * jqLite is either the jQuery or jqLite constructor function
		// * we have to check the existence of jqLite first as this method is called
		//   via the forEach method when constructing the jqLite object in the first place
		if (isArray(obj) || isString(obj)) return true;

		// Support: iOS 8.2 (not reproducible in simulator)
		// "length" in obj used to prevent JIT error (gh-11508)
		var length = 'length' in Object(obj) && obj.length;

		// NodeList objects (with `item` method) and
		// other objects with suitable length characteristics are array-like
		return isNumber(length) && (length >= 0 && (length - 1) in obj || typeof obj.item === 'function');

	}

	var isNumberNaN = Number.isNaN || function isNumberNaN(num) {
		// eslint-disable-next-line no-self-compare
		return num !== num;
	};

	function simpleCompare(a, b) {
		return a === b || (a !== a && b !== b);
	}

	function isValidObjectMaxDepth(maxDepth) {
		return isNumber(maxDepth) && maxDepth > 0;
	}

	function isArrayBuffer(obj) {
		return toString.call(obj) === '[object ArrayBuffer]';
	}

	var TYPED_ARRAY_REGEXP = /^\[object (?:Uint8|Uint8Clamped|Uint16|Uint32|Int8|Int16|Int32|Float32|Float64)Array]$/;

	function isTypedArray(value) {
		return value && isNumber(value.length) && TYPED_ARRAY_REGEXP.test(toString.call(value));
	}

	var hasOwnProperty = Object.prototype.hasOwnProperty;

	var toString = Object.prototype.toString;

	function setHashKey(obj, h) {
		if (h) {
			obj.$$hashKey = h;
		} else {
			delete obj.$$hashKey;
		}
	}

	function forEach(obj, iterator, context) {
		var key, length;
		if (obj) {
			if (isFunction(obj)) {
				for (key in obj) {
					if (key !== 'prototype' && key !== 'length' && key !== 'name' && obj.hasOwnProperty(key)) {
						iterator.call(context, obj[key], key, obj);
					}
				}
			} else if (isArray(obj) || isArrayLike(obj)) {
				var isPrimitive = typeof obj !== 'object';
				for (key = 0, length = obj.length; key < length; key++) {
					if (isPrimitive || key in obj) {
						iterator.call(context, obj[key], key, obj);
					}
				}
			} else if (obj.forEach && obj.forEach !== forEach) {
				obj.forEach(iterator, context, obj);
			} else if (isBlankObject(obj)) {
				// createMap() fast path --- Safe to avoid hasOwnProperty check because prototype chain is empty
				for (key in obj) {
					iterator.call(context, obj[key], key, obj);
				}
			} else if (typeof obj.hasOwnProperty === 'function') {
				// Slow path for objects inheriting Object.prototype, hasOwnProperty check needed
				for (key in obj) {
					if (obj.hasOwnProperty(key)) {
						iterator.call(context, obj[key], key, obj);
					}
				}
			} else {
				// Slow path for objects which do not have a method `hasOwnProperty`
				for (key in obj) {
					if (hasOwnProperty.call(obj, key)) {
						iterator.call(context, obj[key], key, obj);
					}
				}
			}
		}
		return obj;
	}

	function equals(o1, o2) {
		if (o1 === o2) return true;
		if (o1 === null || o2 === null) return false;
		// eslint-disable-next-line no-self-compare
		if (o1 !== o1 && o2 !== o2) return true; // NaN === NaN
		var t1 = typeof o1,
			t2 = typeof o2,
			length, key, keySet;
		if (t1 === t2 && t1 === 'object') {
			if (isArray(o1)) {
				if (!isArray(o2)) return false;
				if ((length = o1.length) === o2.length) {
					for (key = 0; key < length; key++) {
						if (!equals(o1[key], o2[key])) return false;
					}
					return true;
				}
			} else if (isDate(o1)) {
				if (!isDate(o2)) return false;
				return simpleCompare(o1.getTime(), o2.getTime());
			} else if (isRegExp(o1)) {
				if (!isRegExp(o2)) return false;
				return o1.toString() === o2.toString();
			} else {
				if (isWindow(o1) || isWindow(o2) || isArray(o2) || isDate(o2) || isRegExp(o2)) return false;
				keySet = createMap();
				for (key in o1) {
					if (key.charAt(0) === '$' || isFunction(o1[key])) continue;
					if (!equals(o1[key], o2[key])) return false;
					keySet[key] = true;
				}
				for (key in o2) {
					if (!(key in keySet) &&
						key.charAt(0) !== '$' &&
						isDefined(o2[key]) &&
						!isFunction(o2[key])) return false;
				}
				return true;
			}
		}
		return false;
	}

	function copy(source, destination, maxDepth) {
		var stackSource = [];
		var stackDest = [];
		maxDepth = isValidObjectMaxDepth(maxDepth) ? maxDepth : NaN;

		if (destination) {
			if (isTypedArray(destination) || isArrayBuffer(destination)) {
				throw new Error('Can\'t copy! TypedArray destination cannot be mutated.');
			}
			if (source === destination) {
				throw new Error('Can\'t copy! Source and destination are identical.');
			}

			// Empty the destination object
			if (isArray(destination)) {
				destination.length = 0;
			} else {
				forEach(destination, function(value, key) {
					if (key !== '$$hashKey') {
						delete destination[key];
					}
				});
			}

			stackSource.push(source);
			stackDest.push(destination);
			return copyRecurse(source, destination, maxDepth);
		}

		return copyElement(source, maxDepth);

		function copyRecurse(source, destination, maxDepth) {
			maxDepth--;
			if (maxDepth < 0) {
				return '...';
			}
			var h = destination.$$hashKey;
			var key;
			if (isArray(source)) {
				for (var i = 0, ii = source.length; i < ii; i++) {
					destination.push(copyElement(source[i], maxDepth));
				}
			} else if (isBlankObject(source)) {
				// createMap() fast path --- Safe to avoid hasOwnProperty check because prototype chain is empty
				for (key in source) {
					destination[key] = copyElement(source[key], maxDepth);
				}
			} else if (source && typeof source.hasOwnProperty === 'function') {
				// Slow path, which must rely on hasOwnProperty
				for (key in source) {
					if (source.hasOwnProperty(key)) {
						destination[key] = copyElement(source[key], maxDepth);
					}
				}
			} else {
				// Slowest path --- hasOwnProperty can't be called as a method
				for (key in source) {
					if (hasOwnProperty.call(source, key)) {
						destination[key] = copyElement(source[key], maxDepth);
					}
				}
			}
			setHashKey(destination, h);
			return destination;
		}

		function copyElement(source, maxDepth) {
			// Simple values
			if (!isObject(source)) {
				return source;
			}

			// Already copied values
			var index = stackSource.indexOf(source);
			if (index !== -1) {
				return stackDest[index];
			}

			if (isWindow(source)) {
				throw new Error('Can\'t copy! Making copies of Window or Scope instances is not supported.');
			}

			var needsRecurse = false;
			var destination = copyType(source);

			if (destination === undefined) {
				destination = isArray(source) ? [] : isFunction(Object.create)? Object.create(Object.getPrototypeOf(source)) : {};
				needsRecurse = true;
			}

			stackSource.push(source);
			stackDest.push(destination);

			return needsRecurse ?
				copyRecurse(source, destination, maxDepth) :
				destination;
		}

		function copyType(source) {
			switch (toString.call(source)) {
				case '[object Int8Array]':
				case '[object Int16Array]':
				case '[object Int32Array]':
				case '[object Float32Array]':
				case '[object Float64Array]':
				case '[object Uint8Array]':
				case '[object Uint8ClampedArray]':
				case '[object Uint16Array]':
				case '[object Uint32Array]':
					return new source.constructor(copyElement(source.buffer), source.byteOffset, source.length);

				case '[object ArrayBuffer]':
					// Support: IE10
					if (!source.slice) {
						// If we're in this case we know the environment supports ArrayBuffer
						/* eslint-disable no-undef */
						var copied = new ArrayBuffer(source.byteLength);
						new Uint8Array(copied).set(new Uint8Array(source));
						/* eslint-enable */
						return copied;
					}
					return source.slice(0);

				case '[object Boolean]':
				case '[object Number]':
				case '[object String]':
				case '[object Date]':
					return new source.constructor(source.valueOf());

				case '[object RegExp]':
					var re = new RegExp(source.source, source.toString().match(/[^/]*$/)[0]);
					re.lastIndex = source.lastIndex;
					return re;

				case '[object Blob]':
					return new source.constructor([source], {
						type: source.type
					});
			}

			if (isFunction(source.cloneNode)) {
				return source.cloneNode(true);
			}
		}
	}

	var dirtyCheck = (function() {

		var globalPhase = false; // Current state
		var lastDirtyWatch = null;
		var TTL = 10; // Trigger up to 10 times

		/**
		 * function used as an initial value for watchers.
		 * because it's unique we can easily tell it apart from other values
		 */
		function initWatchVal() {}
		function beginPhase(phase) {
			if (globalPhase) {
				throw new Error(globalPhase + ' already in progress');
			}

			globalPhase = phase;
		}

		function clearPhase() {
			globalPhase = null;
		}

		function shallowCopy(target) {
			var source;
			if (!isObject(target)) {
				//primitive
				source = target;
			} else if (isArrayLike(target)) {
				source = new Array(target.length);
				for (var i = 0; i < target.length; i++) {
					source[i] = target[i];
				}
			} else { // if object
				source = {};
				for (var key in target) {
					if (hasOwnProperty.call(target, key)) {
						source[key] = target[key];
					}
				}
			}

			return source
		}

		function watch(watchers, obj, key, listener, getter, objectEquality) {
			var fn = isFunction(listener) ? listener : function() {};
			var get = isFunction(getter) ? function() {
				return getter.call(this, this.data);
			} : function() {
				return this.data.obj[this.data.key];
			};
			var watcher = {
				fn: fn,
				data: {
					obj: obj,
					key: key
				},
				get: get,
				eq: !!objectEquality
			};
			var last = watcher.get();
			watcher.last = isDefined(last) ? last : initWatchVal,

				lastDirtyWatch = null;

			// we use unshift since we use a while loop in digest for speed.
			// the while loop reads in reverse order.
			watchers.push(watcher);

			return function deregisterWatch() {
				var index = arrayRemove(watchers, watcher);
				lastDirtyWatch = null;
			};
		}

		function watchCollection(watchers, obj, key, listener, deep) {
			// the current value, updated on each dirty-check run
			var newValue;
			// a shallow copy of the newValue from the last dirty-check run,
			// updated to match newValue during dirty-check run
			var oldValue;
			// a shallow copy of the newValue from when the last change happened
			var veryOldValue = shallowCopy(obj[key]);
			var internalArray = [];
			var internalObject = {};
			var changeDetected = 0;
			var oldLength = 0;

			function watchCollectionInterceptor(data) {
				newValue = data.obj[data.key];
				var newLength, key, bothNaN, newItem, oldItem;

				// If the new value is undefined, then return undefined as the watch may be a one-time watch
				if (newValue === undefined) return;

				if (!isObject(newValue)) { // if primitive
					if (oldValue !== newValue) {
						oldValue = newValue;
						changeDetected++;
					}
				} else if (isArrayLike(newValue)) {
					if (oldValue !== internalArray) {
						// we are transitioning from something which was not an array into array.
						oldValue = internalArray;
						oldLength = oldValue.length = 0;
						changeDetected++;
					}

					newLength = newValue.length;

					if (oldLength !== newLength) {
						// if lengths do not match we need to trigger change notification
						changeDetected++;
						oldValue.length = oldLength = newLength;
					}
					// copy the items to oldValue and look for changes.
					for (var i = 0; i < newLength; i++) {
						oldItem = oldValue[i];
						newItem = newValue[i];

						// eslint-disable-next-line no-self-compare
						bothNaN = (oldItem !== oldItem) && (newItem !== newItem);
						if (!bothNaN && (oldItem !== newItem)) {
							changeDetected++;
							oldValue[i] = newItem;
						}
					}
				} else {
					if (oldValue !== internalObject) {
						// we are transitioning from something which was not an object into object.
						oldValue = internalObject = {};
						oldLength = 0;
						changeDetected++;
					}
					// copy the items to oldValue and look for changes.
					newLength = 0;
					for (key in newValue) {
						if (hasOwnProperty.call(newValue, key)) {
							newLength++;
							newItem = newValue[key];
							oldItem = oldValue[key];

							if (key in oldValue) {
								// eslint-disable-next-line no-self-compare
								bothNaN = (oldItem !== oldItem) && (newItem !== newItem);
								if (!bothNaN && (oldItem !== newItem)) {
									changeDetected++;
									oldValue[key] = newItem;
								}
							} else {
								oldLength++;
								oldValue[key] = newItem;
								changeDetected++;
							}
						}
					}
					if (oldLength > newLength) {
						// we used to have more keys, need to find them and destroy them.
						changeDetected++;
						for (key in oldValue) {
							if (!hasOwnProperty.call(newValue, key)) {
								oldLength--;
								delete oldValue[key];
							}
						}
					}
				}
				return changeDetected;
			}

			function watchCollectionAction() {
				listener(newValue, veryOldValue);

				// make a copy for the next time a collection is changed
				veryOldValue = shallowCopy(newValue);
			}

			return watch(watchers, obj, key, watchCollectionAction, watchCollectionInterceptor, deep);
		}

		var digest = function(root) {
			if (!isObject(root)) {
				return
			}
			var watch, value, last, fn, get,
				watchers,
				dirty, ttl = TTL,
				next, current, currntNodes = [],
				nodeIdx = 0,
				target = root;

			beginPhase('digest');

			lastDirtyWatch = null;
			do { // "while dirty" loop
				dirty = false;
				current = target;
				currntNodes = [];
				nodeIdx = 0;

				traverseScopesLoop:
					do {
						if ((watchers = config.getWatchers(current))) {
							// process our watches
							var idx = 0;
							while (idx < watchers.length) {
								try {
									watch = watchers[idx];
									// Most common watches are on primitives, in which case we can short
									// circuit it with === operator, only when === fails do we use .equals
									if (watch) {
										get = watch.get;
										if ((value = get.call(watch)) !== (last = watch.last) &&
											!(watch.eq ?
												equals(value, last) :
												(isNumberNaN(value) && isNumberNaN(last)))) {
											dirty = true;
											lastDirtyWatch = watch;
											watch.last = watch.eq ? copy(value, null) : value;
											fn = watch.fn;
											fn(value, ((last === initWatchVal) ? value : last), current);
										} else if (watch === lastDirtyWatch) {
											// If the most recently dirty watcher is now clean, short circuit since the remaining watchers
											// have already been tested.
											dirty = false;
											break traverseScopesLoop;
										}
									}
									// If unwatch self
									if (watch === watchers[idx]) {
										idx++;
									}
								} catch (e) {
									console.error(e);
								}
							}
						}

						// Step to next node
						if (!currntNodes.length) {
							var children = config.getChildren(current);
							if (children && children.length) {
								next = children[0];
								currntNodes = children;
								nodeIdx = 0;
							} else {
								next = null;
							}
						} else {
							nodeIdx++;
							next = currntNodes[nodeIdx];
						}
					} while ((current = next));

				// `break traverseScopesLoop;` takes us to here
				if (dirty && !(ttl--)) {
					clearPhase();
					throw new Error(TTL + ' digest() iterations reached. Aborting!');
				}
			} while (dirty);

			clearPhase();
		};

		var config = {
			getWatchers: function(node) {
				return node.watchers
			},
			getChildren: function(node) {
				return node.children
			}
		};

		return {
			watch: function(watchers, obj, key, listener, deep) {
				if (!isObject(obj) || !isString(key)) {
					return;
				}
				var value = obj[key];
				listener = isFunction(listener) ? listener : function() {};

				if (isArray(value) || isPlainObject(value)) {
					watchCollection(watchers, obj, key, listener, deep);
				} else {
					watch(watchers, obj, key, listener);
				}
			},
			digest: function(root) {
				if (!isObject(root)) {
					return;
				}
				digest(root);
			},
			setConfig: function(cf) {
				if (!isObject(cf)) {
					return;
				}
				config.getWatchers = cf.getWatchers || config.getWatchers;
				config.getChildren = cf.getChildren || config.getChildren;
			}
		}
	})();

	return dirtyCheck;

})));
