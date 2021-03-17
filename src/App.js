import "./App.css";
import {
  useState,
  useContext,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  Fragment,
} from "react";
import { enableMapSet, produce, current } from "immer";

enableMapSet();
// import BiMap from "./TwoWayMap";
const ExampleHashContext = createContext();

// const TwoWayBinding = new BiMap(hashmap, ["upid", "deploymentId"]);

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

var intermittenProgress = 0.0;

function generateEventWithProgress() {
  intermittenProgress = Number(
    Number(intermittenProgress + Math.random() * 0.1).toFixed(4)
  );
  return {
    deploymentId: "27520-11321-64093-45900",
    upid: "16023-28902-73845-35622",
    event: "DownloadReceivedProgress",
    progress: intermittenProgress,
  };
}

const hashmap = Object.keys(exampleHashData).map((key) => {
  return [key, exampleHashData[key]];
});
const emptyDeploymentStatus = {
  deploymentId: null,
  name: null,
  event: null,
  progress: null,
};

const DownloadHashMap = new Map(hashmap);

function ExampleProvider({ children }) {
  const [hashMap, setHashState] = useState(DownloadHashMap);
  const [activeDownloadUpid, setActiveDownloadUpid] = useState(null);
  function updateHashState(nextMapValue) {
    if (nextMapValue instanceof Map) {
      setHashState(new Map(nextMapValue));
    }
  }

  const setEmptyDeploymentStatus = useCallback(
    (upid) => {
      // This is a nice helper when we just add
      const nextHashMap = produce(hashMap, (draftHashMap) => {
        draftHashMap.set(upid, emptyDeploymentStatus);
      });
      return updateHashState(nextHashMap);
    },
    [hashMap]
  );
  const getPropertyOnValue = useCallback(
    (upid, propertyKey) => {
      const keyExists = hashMap.has(upid);
      if (keyExists) {
        const value = hashMap.get(upid);
        if (value && typeof value === "object") {
          return value[propertyKey];
        } else {
          // if it's not an object just give me the whole value, thats a safe fallback.
          return value;
        }
      }
    },
    [hashMap]
  );
  const setPropertyOnValue = useCallback(
    (upid, property) => {
      const keyPairExists = hashMap.has(upid);
      const valueExists = hashMap.get(upid);
      let mergingProperty;
      // if our value is an object, we want to immutably copy it with our
      // new property, so we can use object spread here.
      if (keyPairExists && valueExists && typeof valueExists === "object") {
        mergingProperty = { ...valueExists, ...property };
      } else {
        // otherwise, the new value is the new property.
        mergingProperty = property;
      }
      const nextHashMap = produce(hashMap, (draftHashMap) => {
        draftHashMap.set(upid, mergingProperty);
      });
      return updateHashState(nextHashMap);
    },
    [hashMap]
  );
  const reorderKeys = useCallback(
    (arrKeys) => {
      const nextHashMap = produce(hashMap, (draftHashMap) => {
        arrKeys.forEach((key) => {
          // values persist, we are just shuffling keys
          const currentValue = current(draftHashMap).get(key);
          // remove the key in the old position in the map.
          draftHashMap.delete(key);
          // set the key again, but now because
          // of the iteration of the arrKeys we will be set in order.
          // This is a big advantage over using a standard object,
          // that always tries to alphanumerically order object keys.
          draftHashMap.set(key, currentValue);
        });
      });
      return updateHashState(nextHashMap);
    },
    [hashMap]
  );
  const removeEntity = useCallback(
    (key) => {
      const nextHashMap = produce(hashMap, (draftHashMap) => {
        draftHashMap.delete(key);
      });
      return updateHashState(nextHashMap);
    },
    [hashMap]
  );

  let queuedDownloadUpids = [];
  for (let key of hashMap.keys()) {
    if (key !== activeDownloadUpid) {
      queuedDownloadUpids.push(key);
    }
  }
  Object.freeze(queuedDownloadUpids);
  //From this point on queuedDownloadUpids is a read-only object, thus making it immutable.

  useEffect(() => {
    function startFakePoll() {
      const pollingIntervalId = setInterval(() => {
        const eventFromFakePoll = generateEventWithProgress();

        setPropertyOnValue(activeDownloadUpid, {
          deploymentId: eventFromFakePoll.deploymentId,
          progress: eventFromFakePoll.progress,
          event: eventFromFakePoll.event,
        });
      }, 1000);
      return () => clearInterval(pollingIntervalId);
    }
    const fakePoll = startFakePoll();
    return fakePoll;
  }, [setPropertyOnValue, activeDownloadUpid]);

  return (
    <ExampleHashContext.Provider
      value={{
        hashMap,
        activeDownloadUpid,
        setActiveDownloadUpid,
        queuedDownloadUpids,
        setEmptyDeploymentStatus,
        getPropertyOnValue,
        setPropertyOnValue,
        reorderKeys,
        removeEntity,
      }}
    >
      {children}
    </ExampleHashContext.Provider>
  );
}

const exampleUpidsToAdd = [
  "82903-29393-49495-11249",
  "93940-22341-84932-77342",
  "92034-34912-44902-92301",
];

const QueuedStatusRowContext = createContext();

function QueuedStatusRowProvider(props) {
  const {
    hashMap,
    activeDownloadUpid,
  } = useContext(ExampleHashContext);
  const clonedHashMap = produce(hashMap, (draftHashMap) => {
    draftHashMap.delete(activeDownloadUpid);
  });

  const isNewQueuedStatus = JSON.stringify(Array.from(clonedHashMap.values()))

  const queuedStatus = useMemo(() => {
    const workingArr = [];
    for (let [key, value] of clonedHashMap.entries()) {
      workingArr.push({ upid: key, ...value });
    }
    return workingArr;
  }, [isNewQueuedStatus]);

   return <QueuedStatusRowContext.Provider value={queuedStatus} {...props} />;
}

const ActiveDownloadStatusContext = createContext();
function ActiveDownloadStatusProvider(props) {
  const { hashMap, activeDownloadUpid} = useContext(ExampleHashContext);

  const activeDownloadStatus = useMemo(() => {
    if (hashMap.has(activeDownloadUpid)) {
      const activeDownloadDeploymentStatus = hashMap.get(activeDownloadUpid);
      return {
        upid: activeDownloadUpid,
        ...activeDownloadDeploymentStatus
      }
    }
    return null;
  }, [hashMap.has(activeDownloadUpid), activeDownloadUpid]);

  return <ActiveDownloadStatusContext.Provider value={activeDownloadStatus} {...props} />
}

const DownloadFunctionsContext = createContext();

function DownloadFunctionsProvider(props) {
  const { hashMap, activeDownloadUpid, setActiveDownloadUpid, removeEntity, reorderKeys, setEmptyDeploymentStatus} = useContext(ExampleHashContext);

  function handleReorderOfDownloadQueue(ev) {
     const clonedHashMap = produce(hashMap, (draftHashMap) => {
       draftHashMap.delete(activeDownloadUpid);
     });
    const queuedDownloadUpids = Array.from(clonedHashMap.keys());
    ev.preventDefault();
    // randomly move an index.
    const randomIndex = Math.ceil(Math.random() * queuedDownloadUpids.length - 1);
    const upidMoving = queuedDownloadUpids[randomIndex];
    // move the upid from one point in the array to another.
    const newlyReorderedArr = [
      ...queuedDownloadUpids.slice(0, randomIndex),
      ...queuedDownloadUpids.slice(randomIndex + 1),
      upidMoving,
    ];
    reorderKeys(newlyReorderedArr);
}

function handleDeleteADownloadQueueItem(upid) {
  // an example of an item getting removed after installation. or cancel.
  removeEntity(upid);
}

function createANewDeployment() {
  const upidToAdd = exampleUpidsToAdd.shift();
  console.log(upidToAdd);
  if (upidToAdd) {
    // an example of how easy it is to add new items to queue,
    setEmptyDeploymentStatus(upidToAdd);
  }
}
  const downloadFunctionsValue = {
    handleReorderOfDownloadQueue,
    handleDeleteADownloadQueueItem,
    createANewDeployment,
    setActiveDownloadUpid,
  };

  return <DownloadFunctionsContext.Provider value={downloadFunctionsValue} {...props} />;
}


function Container() {
  const {
    createANewDeployment,
    handleReorderOfDownloadQueue,
  } = useContext(DownloadFunctionsContext);
 
  return (
    <div>
      <div className="section">
        <button onClick={handleReorderOfDownloadQueue}>
          Shuffle A Queue Upid
        </button>
        <button onClick={() => createANewDeployment()}>
          Add a random upid with empty deploymentState
        </button>
      </div>
      <div>
        <ActiveDownloadStatusProvider>
          <ActiveDownloadRow />
        </ActiveDownloadStatusProvider>
      </div>
      <QueuedStatusRowProvider>
        <div className="queueRows">
          <QueueList />
        </div>
      </QueuedStatusRowProvider>
    </div>
  );
}

function QueueList() {
  const queuedStatus = useContext(
    QueuedStatusRowContext
  );
  const { handleDeleteADownloadQueueItem, setActiveDownloadUpid } = useContext(
    DownloadFunctionsContext
  );
  const queueRenderCount = useRef(0)

  return (
    <Fragment>
      <p>This queue has been rendered: {queueRenderCount.current++} times</p>
      {queuedStatus.map((queueStatus, index) => (
        <QueueRow
          key={index}
          setActiveDownloadUpid={setActiveDownloadUpid}
          handleDeleteADownloadQueueItem={handleDeleteADownloadQueueItem}
          {...queueStatus}
        />
      ))}
    </Fragment>
  );
}

function QueueRow({
  upid,
  deploymentId,
  progress,
  event,
  setActiveDownloadUpid,
  handleDeleteADownloadQueueItem,
}) {
  const queueRowRenderCount = useRef(0);
  return (
    <div className="queueRow">
      <div className="section">
        <h4>UPID:</h4>
        <p>{upid}</p>
      </div>
      <div className="section">
        <h4>deploymentId:</h4>
        <p>{deploymentId}</p>
      </div>
      <div className="section">
        <button onClick={() => setActiveDownloadUpid(upid)}>
          {" "}
          set activeDownload{" "}
        </button>
        <button
          onClick={(ev) => {
            ev.preventDefault();
            handleDeleteADownloadQueueItem(upid);
          }}
        >
          {" "}
          remove this entire row from deploymentQueue.{" "}
        </button>
      </div>
      <div className="section">
        <h4>progress:</h4>
        <p>{String(progress)}</p>
        <div
          style={{
            width: `calc(300px - ${progress || 0})`,
            backgroundColor: "black",
          }}
        />
      </div>
      <div className="section">
        <h4>event:</h4>
        <p>{event}</p>
      </div>
      <p>This row has rendered {queueRowRenderCount.current++} times</p>
    </div>
  );
}

function ActiveDownloadRow( ) {
  const activeDownloadStatus = useContext(ActiveDownloadStatusContext);
  const {handleDeleteADownloadQueueItem} = useContext(DownloadFunctionsContext);
  const activeDownloadRowRender = useRef(0);
  if (!activeDownloadStatus) {
    return null;
  }
  const { upid, deploymentId, progress, event } = activeDownloadStatus;

  return (
    <div className="active-row">
      <div className="section">
        <h4>UPID:</h4>
        <p>{upid}</p>
      </div>
      <div className="section">
        <h4>deploymentId:</h4>
        <p>{deploymentId}</p>
      </div>
      <div className="section">
        <button
          onClick={(ev) => {
            ev.preventDefault();
            handleDeleteADownloadQueueItem(upid);
          }}
        >
          {" "}
          remove this entire row from deploymentQueue.{" "}
        </button>
      </div>
      <div className="section">
        <h4>progress:</h4>
        <p>{String(progress)}</p>
        <div
          style={{
            width: `calc(300px - ${progress || 0})`,
            backgroundColor: "black",
          }}
        />
      </div>
      <div className="section">
        <h4>event:</h4>
        <p>{event}</p>
        <p> this row has rendered: {activeDownloadRowRender.current++} times</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <ExampleProvider>
      <DownloadFunctionsProvider>
      <div className="App">
        <Container />
      </div>
      </DownloadFunctionsProvider>
    </ExampleProvider>
  );
}

export default App;
