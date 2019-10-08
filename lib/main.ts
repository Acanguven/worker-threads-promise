import {MessagePort, Worker, WorkerOptions} from "worker_threads";
import {WorkerPromiseOptions, WorkerPromiseProtocol} from "./types";
import hyperId from "hyperid";


class Main extends Worker {
  private requestMap: Map<string, {
    resolve: (value?: any | PromiseLike<any>) => void;
    reject: (reason?: any) => void
  }> = new Map();

  private timeoutCollectors: Map<string, NodeJS.Timeout> = new Map();

  private readonly idGenerator = hyperId({
    fixedLength: true
  });

  constructor(fileName: string, options?: WorkerOptions) {
    super(fileName, options);

    this.hookListener();
  }

  postMessageAsync(value: any, options?: WorkerPromiseOptions, transferList?: Array<ArrayBuffer | MessagePort>) {
    return new Promise((resolve, reject) => {
      const id = this.idGenerator();
      this.requestMap.set(id, {
        resolve,
        reject
      });
      this.postMessage(Main.prepareMessage(id, value), transferList);
      if (options && options.timeout) {
        this.setClear(id, options.timeout, options.unref)
      }
    });
  }

  hookListener() {
    this.on('message', (data: WorkerPromiseProtocol) => {
      if (data && data.___i) {
        const req = this.requestMap.get(data.___i);
        if (req) {
          this.timeoutCollectors.delete(data.___i);

          if (data.error) {
            req.reject(data.error);
          } else {
            req.resolve(data.value);
          }
        }
      }
    });
  }

  private setClear(id: string, ms: number, unref?: boolean) {
    const timeout = setTimeout(() => {
      this.timeout(id);
    }, ms);

    if (unref) {
      timeout.unref();
    }

    this.timeoutCollectors.set(id, timeout);
  }

  private timeout(id: string) {
    this.timeoutCollectors.delete(id);
    const request = this.requestMap.get(id);
    if (request) {
      request.reject(new Error('Worker timeout exceed'));
      this.requestMap.delete(id);
    }
  }

  static prepareMessage(i: string, value?: any, error?: any): WorkerPromiseProtocol {
    return {
      ___i: i,
      error,
      value
    }
  }

  static connect(parentPort: MessagePort) {
    const event = parentPort.on;
    parentPort.on = (type: string, listener: (value: any) => void) => {
      if (type !== 'message') event.apply(parentPort, [type, listener]);

      event.apply(parentPort, ['message', async (data: WorkerPromiseProtocol) => {
        if (data && data.___i) {
          try {
            parentPort.postMessage(this.prepareMessage(data.___i, await listener(data.value)));
          } catch (e) {
            parentPort.postMessage(this.prepareMessage(data.___i, null, data.error));
          }
        } else {
          listener(data.value);
        }
      }]);

      return parentPort;
    }
  }
}

export {
  Main
}
