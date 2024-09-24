
  /**
  * UTILITY FUNCTIONS
  **/

import { Store, StoreResult, StoreValue } from "./store";

  enum DataType {
    DEFAULT, STORE, FUNCTION
  }

  
  export function readDataFromKey(keys: string[], data: any): StoreResult {
    let currentData = data;
  
    for (let i = 0; i < keys.length; i++) {
      const currentKey = keys[i];
      const dataType = determineDataType(currentData[currentKey]);
  
      switch (dataType) {
        case DataType.STORE:
          currentData = currentData[currentKey];
          break;
        case DataType.FUNCTION:
          currentData = currentData[currentKey]();
          break;
        default:
          if (i === keys.length - 1) {
            return currentData[currentKey]; // Final key reached, return the value
          }
          currentData = currentData[currentKey];
          break;
      }
    }
  
    return currentData;
  }

  export function writeDataFromKey(keys: string[], data: any, value: StoreValue): void {
    let currentData = data;
  
    for (let i = 0; i < keys.length; i++) {
      const currentKey = keys[i];
  
      if (i === keys.length - 1) {
        // If this is the last key, assign the value
        currentData[currentKey] = value;
      } else {
        // If the next key does not exist, initialize it as an empty object or Store instance
        currentData[currentKey] = currentData[currentKey] || {};
        currentData = currentData[currentKey];
      }
    }
  }

   function determineDataType(data: any): DataType {
    if (data instanceof Store) {
      return DataType.STORE;
    }
    if (data instanceof Function) {
      return DataType.FUNCTION;
    }
    return DataType.DEFAULT;
  }