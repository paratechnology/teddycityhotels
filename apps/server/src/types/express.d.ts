import { IUserIndex } from "@teddy-city-hotels/shared-interfaces";

// This uses declaration merging to add a 'user' property to the global Express Request interface.
// This tells TypeScript that any 'Request' object *might* have a 'user' property.
declare global {
  namespace Express {
    export interface Request {
      user?: IUserIndex;
    }
  }
}

// This export is necessary to make the file a module and allow the global augmentation to work correctly.
export {};