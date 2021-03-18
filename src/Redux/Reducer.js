import {produce, current} from "immer";

import {
    SET_PROPERTY_ON_VALUE,
    REORDER_KEYS,
    REMOVE_ENTITY,
    RESET,
    SET_ACTIVE_DOWNLOAD,
} from "./Actions";


const exampleHashData = {
  "32424-34242-34232-84424": {
    deploymentId: "30303-42420-234234-23424",
    name: "Example Name A",
    event: "DownloadingStarted",
    progress: 27.01,
  },
  "92935-78002-20920-29234": {
    deploymentId: "02902-90493-45092-08234",
    name: "Example Name B",
    event: "DownloadError",
    progress: null,
  },
  "84573-28302-03845-37424": {
    deploymentId: "32020-11242-34093-45908",
    name: "Example Name C",
    event: "DownloadingStarted",
    progress: 0.0,
  },
  "86093-28402-03845-37624": {
    deploymentId: "36020-81321-34033-45908",
    name: "Example Name D",
    event: "DownloadingStarted",
    progress: 67.891,
  },
  "16023-28902-73845-35622": {
    deploymentId: "27520-11321-64093-45900",
    name: "Example Name E",
    event: "DownloadingStarted",
    progress: 0.0,
  },
  "19453-26862-73845-62624": {
    deploymentId: "97920-18321-64084-15200",
    name: "Example Name F",
    event: "DownloadingStarted",
    progress: 19.276,
  },
};

const hashmap = Object.keys(exampleHashData).map((key) => {
  return [key, exampleHashData[key]];
});

export const defaultDownloadMangerState = new Map(hashmap);

export function DownloadManagerReducer(state = defaultDownloadMangerState, action) {
    switch(action.type) {
        case SET_PROPERTY_ON_VALUE:
            return produce(state, draftState => {
                const keyPairExists = current(draftState).has(action.key);
                const valueExists = current(draftState).get(action.key);
                let mergingProperty;
                // if our value is an object, we want to immutably copy it with our
                // new property, so we can use object spread here.
                if (
                  keyPairExists &&
                  valueExists &&
                  typeof valueExists === "object"
                ) {
                  mergingProperty = { ...valueExists, ...action.property };
                } else {
                  // otherwise, the new value is the new property.
                  mergingProperty = action.property;
                }
                draftState.set(action.key, mergingProperty);
            });
        case REORDER_KEYS:
            return produce(state, draftState => {
                action.keysOrder.forEach((key) => {
                  // values persist, we are just shuffling keys
                  const currentValue = current(draftState).get(key);
                  // remove the key in the old position in the map.
                  draftState.delete(key);
                  // set the key again, but now because
                  // of the iteration of the arrKeys we will be set in order.
                  // This is a big advantage over using a standard object,
                  // that always tries to alphanumerically order object keys.
                  draftState.set(key, currentValue);
                });
            });
        case REMOVE_ENTITY: 
            return produce(state, draftState => {
                draftState.remove(action.key);
            });
        case RESET: 
            return defaultDownloadMangerState;
        default: 
            return state;
    }
}

export const defaultActiveDownloadState = "16023-28902-73845-35622";
export function ActiveDownloadUpidReducer (state = defaultActiveDownloadState, action) {
    switch(action.type) {
        case SET_ACTIVE_DOWNLOAD:
            return action.upid;
        default: 
            return state;
    }
}

