'use strict'

/**
 * StateManager
 * 
 * Manages page read state. Utilizes storage.sync to synchronize
 * state between devices. State is represented in a bit array to minimize
 * size, since storage.sync has strict limits on data size.
 * 
 */
class StateManager {
  // Key to use
  static _Key = 'scp1';

  /**
   * Initialize by loading current state.
   * 
   * @param {*} onSuccess - Callback on success
   * @param {*} onError - Callback on error
   */
  initialize(onSuccess, onError) {
    this.database = new localStorageDB("scpdb", localStorage);

    //Check if freshly created, and then init tables etc
    if (this.database.isNew()){
      console.log("Creating fresh db");
      //Create pages table
      this.database.createTable("Pages", ["uri", "state", "title"]);

      this.database.commit();
    }
    else{
      console.log("DB pre existing");
    }

    //TODO: Load-Sync from cloud(??)
    this._loadData(onSuccess, onError);
  }

  /**
   * Returns read state of the given page (true === read, false === unread).
   * @param {string} url - Page URL. Must match /scp-XXXX format.
   */
  getState(url) {

    var queryResult = this.database.queryAll("Pages", {query: {uri: url}});
    if (queryResult.length != 1){
      return 0;
    }
    else{
      return queryResult[0].state;
    }
  }

  /**
   * Toggle page read state for given url.
   * @param {string} url - Page URL. Must match /scp-XXXX format.
   * @param {function} onSuccess - Callback on success.
   * @param {function} onError - Callback on error.
   */
  toggleState(url, title, onSuccess, onError) {
    
    //TODO: Pass in desired state, don't read
    var queryResult = this.database.queryAll("Pages", {
      query: {uri: url}
    });
    var currentState = queryResult[0]?.state;

    if (currentState == undefined){
      currentState = 1;
    }
    else if (currentState == 0){
      currentState = 1
    }
    else{
      currentState = 0
    }

    this.database.insertOrUpdate("Pages", 
      { uri: url},
      { uri: url, state: currentState, title: title});
    this.database.commit();

    onSuccess(currentState);

    this._saveData();
  }

  /**
   * Returns all read states
   */
  getStates() {
    console.log("GetStates");
    var query = this.database.queryAll(
      "Pages", 
      {query: {state: 1},
      sort: [["title", "ASC"]]
    });
    console.log(query);
    return query;
  }

  /**
   * Internal method to load data from storage.sync
   * @param {*} onSuccess - Callback on success
   * @param {*} onError  - Callback on error
   */
  _loadData(onSuccess, onError) {

    chrome.storage.local.get("scpdb", function (result) {
      if (chrome.runtime.lastError) {
        console.error(`Failed to read data: ${chrome.runtime.lastError}`);
        if (onError) {
          onError(chrome.runtime.lastError);
        }
      } else {
        console.log("Found result:");
        console.log(result);
        if (result != null && result.scpdb != null) {
          console.log('Overwriting localstorage db now');
          localStorage.setItem("db_scpdb", result.scpdb);
        }
        if (onSuccess) {
          onSuccess();
        }
      }
    });
  }

   /**
   * Internal method to save data to storage.sync
   * @param {*} onSuccess - Callback on success
   * @param {*} onError - Callback on error
   */
    _saveData() {
      var localString = localStorage.getItem("db_scpdb");
      var data = {scpdb: localString};
      chrome.storage.local.set(data, function () {
        if (chrome.runtime.lastError) {
          console.error('Failed to save page read data: ' + chrome.runtime.lastError);
          // if (onError) {
          //   // onError(chrome.runtime.lastError);
          // }
        } else {
          console.debug(`Saved data with key`);
          console.log(data);
          // if (onSuccess) {
          //   // onSuccess();
          // }
        }
      });
    }

    wipeData() {
      console.log("Wiping now");
      chrome.storage.local.remove("scpdb");

      localStorage.removeItem("db_scpdb");
    }
  
    getRaw(){
      return localStorage.getItem("db_scpdb");
    }

  /**
   * Listens for data updates. On update, re-loads data.
   * @param {*} callback - Callback on data change
   */
  _listenForUpdates(callback) {
    var that = this;
    chrome.storage.onChanged.addListener(function (changes, namespace) {
      for (var key in changes) {
        var storageChange = changes[key];
        console.info(`Storage key '${key}' in namespace '${namespace}' changed.`);
        if (key === StateManager._Key) {
          that.bitArray.fromBase64(storageChange.newValue);
          if (callback) {
            callback();
          }
        }
      }
    });
  }
}
