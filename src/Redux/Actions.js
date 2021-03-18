
const SET_PROPERTY_ON_VALUE = `SET_PROPERTY_ON_VALUE`;
const REORDER_KEYS = `REORDER_KEYS`;
const REMOVE_ENTITY = `REMOVE_ENTITY`;
const RESET = `RESET`;
const SET_ACTIVE_DOWNLOAD = `SET_ACTIVE_DOWNLOAD`;

const emptyDeploymentStatus = {
  deploymentId: null,
  name: null,
  event: null,
  progress: null,
};

const setPropertyOnValue = (upid, deploymentStatus) => ({type: SET_PROPERTY_ON_VALUE, key: upid, property: deploymentStatus});
const reorderKeys = (arrKeys) => ({type: REORDER_KEYS, keysOrder: arrKeys});
const removeEntity = (upid) => ({type: REMOVE_ENTITY, key: upid});
const resetState = () => ({type: RESET});
const setActiveDownloadUpid = (upid) => ({type: SET_ACTIVE_DOWNLOAD, upid});
const setEmptyDeploymentStatus = (upid, properties) => ({
    type:SET_PROPERTY_ON_VALUE, 
    key: upid, 
    property: {...emptyDeploymentStatus, ...properties}
});


export {
  SET_PROPERTY_ON_VALUE,
  REORDER_KEYS,
  REMOVE_ENTITY,
  RESET,
  SET_ACTIVE_DOWNLOAD,
  setPropertyOnValue,
  reorderKeys,
  removeEntity,
  resetState,
  setActiveDownloadUpid,
  setEmptyDeploymentStatus
};