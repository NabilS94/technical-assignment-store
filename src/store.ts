import "reflect-metadata";

import { JSONArray, JSONObject, JSONPrimitive } from "./json-types";
import { writeDataFromKey, readDataFromKey } from "./utils";

export type Permission = "r" | "w" | "rw" | "none";

export type StoreResult = Store | JSONPrimitive | undefined;

export type StoreValue =
  | JSONObject
  | JSONArray
  | StoreResult
  | (() => StoreResult);

export interface IStore {
  defaultPolicy: Permission;
  allowedToRead(key: string): boolean;
  allowedToWrite(key: string): boolean;
  read(path: string): StoreResult;
  write(path: string, value: StoreValue): StoreValue;
  writeEntries(entries: JSONObject): void;
  entries(): JSONObject;
}

export function Restrict(...permissions: Permission[]): any {
  return function (target: IStore, key: string) {
    Reflect.defineMetadata("permission", permissions, target, key);
  }
}

export class Store implements IStore {
  defaultPolicy: Permission = "rw";

  allowedToRead(key: string): boolean {
    const keyPermissions: Permission[] = Reflect.getMetadata("permission", this, key) || [this.defaultPolicy];
    return keyPermissions.includes("r") || keyPermissions.includes("rw");
  }

  allowedToWrite(key: string): boolean {
    const keyPermissions: Permission[] = Reflect.getMetadata("permission", this, key) || [this.defaultPolicy];
    return keyPermissions.includes("w") || keyPermissions.includes("rw");
  }

  read(path: string): StoreResult {
    const keys = path.split(":");
    const subPath = keys.slice(1).join(":");
    const data: any = this;

    // Handle nested store case
    if (keys.length > 1 && data[keys[0]] instanceof Store) {
      return data[keys[0]].read(subPath);
    }

    // Enforce read permissions
    if (!this.allowedToRead(keys[0])) {
      throw new Error('Access denied for read');
    }

    // Use utility function to handle reading through keys
    const result = keys.length > 1 ? readDataFromKey(keys, this) : data[keys[0]];

    // Return function result if the value is a function, otherwise the value itself
    return result instanceof Function ? result() : result !== undefined ? result : null;
  }

  write(path: string, value: StoreValue): StoreValue {
    const keys = path.split(":");
    const subPath = keys.slice(1).join(":");
    const data: any = this;

    // Handle nested store case
    if (keys.length > 1 && data[keys[0]] instanceof Store) {
      return data[keys[0]].write(subPath, value);
    }

    // Enforce write permissions
    if (!this.allowedToWrite(keys[0])) {
      throw new Error('Access denied for write');
    }

    // Use utility function to write data through keys
    writeDataFromKey(keys, this, value);

    return value;
  }

  writeEntries(entries: JSONObject): void {
    for (const key in entries) {
      if (entries.hasOwnProperty(key)) {
        this.write(key, entries[key]);
      }
    }
  }

  entries(): JSONObject {
    const keys = Object.keys(this);
    const entries: JSONObject = {};
    const data: any = this;

    for (const key of keys) {
      if (Reflect.getMetadata('permission', this, key) && this.allowedToRead(key)) {
        entries[key] = data[key]
      }
    }
    return entries
  }
}