import { Injectable } from '@angular/core';
//import { environment } from '../../../environments/environment';
import { Apollo } from 'apollo-angular';
import * as Query from '../GraphQL/log.gql';
import { LocalStorageService } from './localStorage';
import { Constants } from '../classes/general';
import { add } from 'lodash';
import { environment } from 'environments/environment';
@Injectable({
  providedIn: 'root',
})
export class LogsService {
  loggedInuser: any;
  constructor(
    private apollo: Apollo,
    private _localStorage: LocalStorageService,
  ) { }
  log(msg: any, level: any, additionalData: any = "") {
    this.loggedInuser = this._localStorage.get(Constants.LOGGED_IN_USER);
    if (environment.debugging) {
      this.apollo
        .query({
          query: Query.LogQL,
          variables: {
            request: {
              name: environment.logName,
              message: msg,
              level: level,
              body: {
                userId: this.loggedInuser && this.loggedInuser.id ? this.loggedInuser.id : '',
                email: this.loggedInuser && this.loggedInuser.email ? this.loggedInuser.email : '',
                additionalData: additionalData != null ? this.safeStringify(additionalData) : '',
                clientSideData: navigator.userAgent,
              },
            },
          },
        })
        .subscribe({ error: () => { } });
    } else {
      console.log(msg, additionalData);
    }
  }

  // Never throws: handles circular references, DOM nodes and events, and caps very large payloads.
  private safeStringify(data: any, maxLength: number = 10000): string {
    let result: string;
    try {
      const seen = new WeakSet();
      result = JSON.stringify(data, (key, value) => {
        if (value instanceof Error) {
          return { name: value.name, message: value.message, stack: value.stack };
        }
        if (typeof Node !== 'undefined' && value instanceof Node) {
          return '[DOM ' + value.nodeName + ']';
        }
        if (typeof Event !== 'undefined' && value instanceof Event) {
          return '[Event ' + value.type + ']';
        }
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular]';
          }
          seen.add(value);
        }
        return value;
      });
    } catch (e) {
      try {
        result = String(data);
      } catch (e2) {
        result = '[Unserializable data]';
      }
    }
    if (result === undefined) {
      result = '';
    }
    if (result.length > maxLength) {
      result = result.substring(0, maxLength) + '...[truncated ' + (result.length - maxLength) + ' chars]';
    }
    return result;
  }

  logObject(object: any) {
    // if(environment.debugging) {
    //   //console.log(new Date() + ": ");
    //   //console.log(object);
    // }
  }
}
