import "./App.css";
import { useState, useContext, createContext } from "react";
// import BiMap from "./TwoWayMap";
const ExampleHashContext = createContext();

// const TwoWayBinding = new BiMap(hashmap, ["upid", "deploymentId"]);

class DeploymentStatusMap extends Map {
  emptyDeploymentStatus = {
    deploymentId: null,
    name: null,
    event: null,
    progress: null
  };
  setEmptyDeploymentStatus = upid => {
    // This is a nice helper when we just add
    this.set(upid, this.emptyDeploymentStatus);
    return this;
  };
  getPropertyOnValue = (upid, propertyKey) => {
    const keyExists = this.has(upid);
    if (keyExists) {
      const value = this.get(upid);
      if (value && typeof value === "object") {
        return value[propertyKey];
      } else {
        // if it's not an object just give me the whole value, thats a safe fallback.
        return value;
      }
    }
  };
  setPropertyOnValue = (upid, property) => {
    const keyPairExists = this.has(upid);
    const valueExists = this.get(upid);
    let mergingProperty;
    // if our value is an object, we want to immutably copy it with our
    // new property, so we can use object spread here.
    if (keyPairExists && valueExists && typeof valueExists === "object") {
      mergingProperty = { ...valueExists, ...property };
    } else {
      // otherwise, the new value is the new property.
      mergingProperty = property;
    }
    this.set(upid, mergingProperty);
    return this;
  };
  reorderKeys = arrKeys => {
    arrKeys.forEach(key => {
      // values persist, we are just shuffling keys
      const currentValue = this.get(key);
      // remove the key in the old position in the map.
      this.delete(key);
      // set the key again, but now because
      // of the iteration of the arrKeys we will be set in order.
      // This is a big advantage over using a standard object,
      // that always tries to alphanumerically order object keys.
      this.set(key, currentValue);
    });
    return this;
  };
  asMapArray = () => {
    const arrayOfHashMapObject = [];
    this.forEach((value, key) => {
      arrayOfHashMapObject.push({ upid: key, ...value });
    });
    return arrayOfHashMapObject;
  };
}

const exampleHashData = {
  "32424-34242-34232-84424": {
    deploymentId: "30303-42420-234234-23424",
    name: "Example Name A",
    event: "DownloadingStarted",
    progress: 27.01
  },
  "92935-78002-20920-29234": {
    deploymentId: "02902-90493-45092-08234",
    name: "Example Name B",
    event: "DownloadError",
    progress: null
  },
  "84573-28302-03845-37424": {
    deploymentId: "32020-11242-34093-45908",
    name: "Example Name C",
    event: "DownloadingStarted",
    progress: 0.0
  },
  "86093-28402-03845-37624": {
    deploymentId: "36020-81321-34033-45908",
    name: "Example Name D",
    event: "DownloadingStarted",
    progress: 67.891
  },
  "16023-28902-73845-35622": {
    deploymentId: "27520-11321-64093-45900",
    name: "Example Name E",
    event: "DownloadingStarted",
    progress: 0.0
  },
  "19453-26862-73845-62624": {
    deploymentId: "97920-18321-64084-15200",
    name: "Example Name F",
    event: "DownloadingStarted",
    progress: 19.276
  }
};

const hashmap = Object.keys(exampleHashData).map(key => {
  return [key, exampleHashData[key]];
});

const DownloadHashMap = new DeploymentStatusMap(hashmap);

function ExampleProvider({ children }) {
  const [hashMap, setHashState] = useState(DownloadHashMap);
  const [activeDownloadUpid, setActiveDownloadUpid] = useState(null);
  function updateHashState(nextMapValue) {
    if (nextMapValue instanceof DeploymentStatusMap) {
      setHashState(new DeploymentStatusMap(nextMapValue));
    }
  }

  let queuedDownloadUpids = [];
  for (let key of hashMap.keys()) {
    if (key !== activeDownloadUpid) {
      queuedDownloadUpids.push(key);
    }
  }
  Object.freeze(queuedDownloadUpids);
  //From this point on queuedDownloadUpids is a read-only object, thus making it immutable.

  return (
    <ExampleHashContext.Provider
      value={{
        hashMap,
        activeDownloadUpid,
        setActiveDownloadUpid,
        queuedDownloadUpids,
        updateHashState
      }}
    >
      {children}
    </ExampleHashContext.Provider>
  );
}

const exampleUpidsToAdd = [
  "82903-29393-49495-11249",
  "93940-22341-84932-77342",
  "92034-34912-44902-92301"
];

function ValueDumpComponent() {
  const {
    hashMap,
    activeDownloadUpid,
    setActiveDownloadUpid,
    queuedDownloadUpids,
    updateHashState
  } = useContext(ExampleHashContext);
  const formulateAnObject = {};
  for (let [key, value] of hashMap.entries()) {
    formulateAnObject[key] = value;
  }
  function handleClickEventHashMap(event) {
    event.preventDefault();
    // find the currentValue, increase it by 1;
    const currentProgress = hashMap.getPropertyOnValue(
      "84573-28302-03845-37424",
      "progress"
    );
    hashMap.setPropertyOnValue("84573-28302-03845-37424", {
      progress: currentProgress + 1
    });
    //a lways send the hashMap back in the updateState
    // so it can regenerate the immutable object and trigger a re-render.
    updateHashState(hashMap);
  }
  function handleReorderOfDownloadQueue(ev) {
    ev.preventDefault();
    // randomly move an index.
    const randomIndex = Math.ceil(
      Math.random() * queuedDownloadUpids.length - 1
    );
    const upidMoving = queuedDownloadUpids[randomIndex];
    // move the upid from one point in the array to another.
    const newlyReorderedArr = [
      ...queuedDownloadUpids.slice(0, randomIndex),
      ...queuedDownloadUpids.slice(randomIndex + 1),
      upidMoving
    ];
    hashMap.reorderKeys(newlyReorderedArr);
    updateHashState(hashMap);
  }

  function handleDeleteADownloadQueueItem(upid) {
    if (upid === activeDownloadUpid) {
      setActiveDownloadUpid(null);
    }
    hashMap.delete(upid);
    updateHashState(hashMap);
  }

  function createANewDeployment() {
    const upidToAdd = exampleUpidsToAdd.shift();
    console.log(upidToAdd);
    if (upidToAdd) {
      const updatedHash = hashMap.setEmptyDeploymentStatus(upidToAdd);
      updateHashState(updatedHash);
    }
  }

  const deploymentStatusMapToArr = hashMap.asMapArray();

  return (
    <div>
      <button onClick={handleClickEventHashMap}> Update a property </button>
      <button onClick={handleReorderOfDownloadQueue}>
        Shuffle A Queue Upid
      </button>
      <button onClick={() => createANewDeployment()}>
        Add a random upid with empty deploymentState
      </button>
      <div className="code-block">
        <p>active download</p>
        <p>{String(activeDownloadUpid)}</p>
        <button onClick={() => setActiveDownloadUpid(null)}>
          Clear ActiveDownload
        </button>
      </div>
      <div className="code-block">
        <p> queuedDownloadUpids </p>
        {queuedDownloadUpids.join(" , ")}
      </div>
      <hr />
      <div>
        {deploymentStatusMapToArr.map(({ upid, ...values }) => {
          return (
            <div key={upid} className="code-block">
              <div className="section">
                <h4>UPID:</h4>
                <p>{upid}</p>
              </div>
              <div className="section">
                <button onClick={() => setActiveDownloadUpid(upid)}>
                  {" "}
                  set activeDownload{" "}
                </button>
                <button
                  onClick={ev => {
                    ev.preventDefault();
                    handleDeleteADownloadQueueItem(upid);
                  }}
                >
                  {" "}
                  remove this entire row from deploymentQueue.{" "}
                </button>
              </div>
              <div className="section">
                <h4>deploymentId:</h4>
                <p>{values.deploymentId}</p>
              </div>
              <div className="section">
                <h4>progress:</h4>
                <p>{String(values.progress)}</p>
              </div>
              <div className="section">
                <h4>event:</h4>
                <p>{values.event}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function App() {
  return (
    <ExampleProvider>
      <div className="App">
        <ValueDumpComponent />
      </div>
    </ExampleProvider>
  );
}

export default App;
