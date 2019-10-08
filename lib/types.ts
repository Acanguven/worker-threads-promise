interface WorkerPromiseOptions {
  timeout?: number;
  unref?: boolean;
}

interface WorkerPromiseProtocol {
  value?: any;
  error?: any;
  ___i?: string;
}

export {
  WorkerPromiseOptions,
  WorkerPromiseProtocol
}
