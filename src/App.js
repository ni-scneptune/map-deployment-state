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
import { enableMapSet, produce } from "immer";
import {
  setPropertyOnValue,
  reorderKeys,
  removeEntity,
  resetState,
  setActiveDownloadUpid,
  setEmptyDeploymentStatus,
} from "./Redux/Actions";
import {
  createSelector,
  createSelectorCreator,
  defaultMemoize,
} from "reselect";
import {
  Provider as ReduxProvider,
  useSelector,
  useDispatch,
} from "react-redux";
import store from "./Redux/Store";

enableMapSet();

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
function DownloadManagerProvider({ children }) {

  return <ReduxProvider store={store}>{children}</ReduxProvider>;
}

const exampleUpidsToAdd = [
  "82903-29393-49495-11249",
  "93940-22341-84932-77342",
  "92034-34912-44902-92301",
];

const deploymentStatusMapSelector = (state) => state.deploymentStatusMap,
  activeDownloadUpidSelector = (state) => state.activeDownloadUpid;

const memoizedQueuedSelector = createSelectorCreator(
  defaultMemoize,
  (previousQueuedStatusMap, nextQueuedStatusMap) => {
    const previousJSONStatusMap = JSON.stringify(
      Array.from(previousQueuedStatusMap.values())
    );
    const nextJSONStatusMap = JSON.stringify(
      Array.from(nextQueuedStatusMap.values())
    );
    return previousJSONStatusMap === nextJSONStatusMap;
  }
);
const queuedDeploymentStatusSelector = createSelector(
  [deploymentStatusMapSelector, activeDownloadUpidSelector],
  (deploymentStatusMap, activeDownloadUpid) => {
    const cloned = produce(deploymentStatusMap, (draftDeploymentStatusMap) => {
      draftDeploymentStatusMap.delete(activeDownloadUpid);
    });
    return cloned;
  }
);

const queuedDownloadUpidsSelector = memoizedQueuedSelector(
  [queuedDeploymentStatusSelector],
  (clonedDeploymentStatusMap) => {
    const queuedDownloadUpids = Array.from(clonedDeploymentStatusMap.keys());
    console.log("how many times do we re-run")
    return queuedDownloadUpids;
  }
);

function Container() {
  const dispatch = useDispatch();

  const queuedDownloadUpids = useSelector(queuedDownloadUpidsSelector);

  function createANewDeployment() {
    const upidToAdd = exampleUpidsToAdd.shift();
    if (upidToAdd) {
      // an example of how easy it is to add new items to queue,
      dispatch(setEmptyDeploymentStatus(upidToAdd, {}));
    }
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
      upidMoving,
    ];
    dispatch(reorderKeys(newlyReorderedArr));
  }

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
        <ActiveDownloadRow />
      </div>
      <div className="queueRows">
        <QueueList />
      </div>
    </div>
  );
}

const queuedStatusSelector = memoizedQueuedSelector(
// const queuedStatusSelector = createSelector(
  [queuedDeploymentStatusSelector],
  (deploymentStatusWithoutActive) => {
    const queuedStatus = [];
    for (let [key, value] of deploymentStatusWithoutActive.entries()) {
      queuedStatus.push({ upid: key, ...value });
    }
    return queuedStatus;
  }
);

function QueueList() {
  const dispatch = useDispatch();
  const queuedStatus = useSelector(queuedStatusSelector);

  function handleDeleteADownloadQueueItem(upid) {
    // an example of an item getting removed after installation. or cancel.
    dispatch(removeEntity(upid));
  }

  const setDeploymentToActiveDownload = (upid) =>
    dispatch(setActiveDownloadUpid(upid));

  const queueRenderCount = useRef(0);

  return (
    <Fragment>
      <p>This queue has been rendered: {queueRenderCount.current++} times</p>
      {queuedStatus.map((queueStatus, index) => (
        <QueueRow
          key={index}
          setDeploymentToActiveDownload={setDeploymentToActiveDownload}
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
  name,
  event,
  setDeploymentToActiveDownload,
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
        <h4>name:</h4>
        <p>{name}</p>
      </div>
      <div className="section">
        <button onClick={() => setDeploymentToActiveDownload(upid)}>
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

const activeDownloadStatusSelector = createSelector(
  [deploymentStatusMapSelector, activeDownloadUpidSelector],
  (deploymentStatusMap, activeDownloadUpid) => {
    if (activeDownloadUpid && deploymentStatusMap.has(activeDownloadUpid)) {
      const activeDownloadDeploymentStatus = deploymentStatusMap.get(
        activeDownloadUpid
      );
      return {
        upid: activeDownloadUpid,
        ...activeDownloadDeploymentStatus,
      };
    } else {
      return null;
    }
  }
);

function ActiveDownloadRow() {
  const dispatch = useDispatch();

  const activeDownloadStatus = useSelector(activeDownloadStatusSelector);

  function handleDeleteADownloadQueueItem(upid) {
    // an example of an item getting removed after installation. or cancel.
    dispatch(removeEntity(upid));
  }

  useEffect(() => {
    function startFakePoll() {
      const pollingIntervalId = setInterval(() => {
        const eventFromFakePoll = generateEventWithProgress();
        if (activeDownloadStatus) {
          dispatch(
            setPropertyOnValue(activeDownloadStatus.upid, {
              deploymentId: eventFromFakePoll.deploymentId,
              progress: eventFromFakePoll.progress,
              event: eventFromFakePoll.event,
            })
          );
        }
      }, 1000);
      return () => clearInterval(pollingIntervalId);
    }
    const fakePoll = startFakePoll();
    return fakePoll;
  }, [activeDownloadStatus, dispatch]);

  const activeDownloadRowRender = useRef(0);
  if (!activeDownloadStatus) {
    return null;
  }

  const { upid, deploymentId, progress, name, event } = activeDownloadStatus;

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
        <h4>name:</h4>
        <p>{name}</p>
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
    <DownloadManagerProvider>
      <div className="App">
        <Container />
      </div>
    </DownloadManagerProvider>
  );
}

export default App;
