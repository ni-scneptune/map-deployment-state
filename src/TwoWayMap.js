export default class BiMap {
  forwardMap = new Map();
  reverseMap = new Map();
  reverseKey = false;
  forwardKey = false;
  constructor(map, hashKeys) {
    let forwardKey = (map && map.forwardKey) || (hashKeys && hashKeys[0]);
    let reverseKey = (map && map.reverseKey) || (hashKeys && hashKeys[1]);
    if (forwardKey && reverseKey) {
      this.setReverseKey(forwardKey, reverseKey);
    }
    if (map) {
      if (map instanceof Map) {
        map.forEach((value, key) => {
          this.set(key, value);
        });
      } else if (Array.isArray(map)) {
        map.forEach(entry => {
          this.set(entry[0], entry[1]);
        });
      } else {
        Object.keys(map).forEach(key => {
          this.set(key, map[key]);
        });
      }
    }
  }
  setReverseKey = (forwardKeyName, reverseKeyName) => {
    this.reverseKey = reverseKeyName;
    this.forwardKey = forwardKeyName;
    return this;
  };
  size = () => this.forwardMap.size;
  useReverseKeyLookup = mapValue =>
    typeof mapValue == "object" && this.reverseKey;
  useForwardKeyLookup = mapValue =>
    typeof mapValue == "object" && this.forwardKey;
  set = (key, value) => {
    if (this.forwardMap.has(key)) {
      let existingValue = this.forwardMap.get(key);
      if (this.useReverseKeyLookup(existingValue)) {
        existingValue = existingValue[this.reverseKey];
      }
      this.reverseMap.delete(existingValue);
    }

    if (this.reverseMap.has(key)) {
      let existingKey = this.reverseMap.get(key);
      if (this.useForwardKeyLookup(existingKey)) {
        existingKey = existingKey[this.forwardKey];
      }
      this.forwardMap.delete(existingKey);
    }

    let assignableKey = key,
      assignableValue = value;

    this.forwardMap.set(assignableKey, assignableValue);

    if (this.reverseKey && this.forwardKey && typeof value == "object") {
      assignableValue = assignableValue[this.reverseKey];

      const mergedKeyObj = {
        [this.forwardKey]: key,
        ...value
      };
      delete mergedKeyObj[this.reverseKey];
      assignableKey = mergedKeyObj;
    }
    this.reverseMap.set(assignableValue, assignableKey);
    return this;
  };
  setValueProperty = (key, overwrittingKeyValueObj) => {
    const existingValue = this.getByKey(key);
    this.set(key, { ...existingValue, ...overwrittingKeyValueObj });
    return this;
  };
  getByKey = key => this.forwardMap.get(key);
  getByValue = valueKey => this.reverseMap.get(valueKey);
  hasKey = key => this.forwardMap.has(key);
  hasValue = valueKey => this.reverseMap.has(valueKey);
  deleteKey = key => {
    const value = this.forwardMap.get(key);
    this.reverseMap.delete(value[this.reverseKey]);
    return this;
  };
  deleteValue = valueKey => {
    let key = this.reverseMap.get(valueKey);
    if (this.useForwardKeyLookup(key)) {
      key = key[this.forwardKey];
    }
    this.forwardMap.delete(key);
    this.reverseMap.delete(valueKey);
    return this;
  };
  keys = () => this.forwardMap.keys();
  values = () => this.forwardMap.values();
  entries = () => this.forwardMap.entries();
  forEach = callbackFn => this.forwardMap.forEach(callbackFn);
  clear = () => {
    this.forwardMap.clear();
    this.reverseMap.clear();
  };
}
