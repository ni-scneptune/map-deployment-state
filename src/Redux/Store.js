import { createStore, combineReducers, applyMiddleware } from "redux";
import ReduxThunk from "redux-thunk";
import { composeWithDevTools } from "redux-devtools-extension";
import {
  ActiveDownloadUpidReducer,
  DownloadManagerReducer,
  defaultActiveDownloadState,
  defaultDownloadMangerState,
} from "./Reducer";

const combinedDefaultState = {
  activeDownloadUpid: defaultActiveDownloadState,
  deploymentStatusMap: defaultDownloadMangerState,
};

const enhancedCompose = composeWithDevTools({serialize: true});

const store = createStore(
  combineReducers({
    activeDownloadUpid: ActiveDownloadUpidReducer,
    deploymentStatusMap: DownloadManagerReducer,
  }),
  combinedDefaultState,
  enhancedCompose(applyMiddleware(ReduxThunk))
);

export default store;
