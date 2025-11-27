export type MaybePromise<T> = T | Promise<T>;

export type SelectOption<V, D = undefined> = D extends undefined
  ? {
      value: V;
      label: string;
      icon?: string;
      group?: string;
      keywords?: string[];
      disabled?: boolean;
    }
  : {
      data: D;
      value: V;
      label: string;
      icon?: string;
      group?: string;
      keywords?: string[];
      disabled?: boolean;
    };

// Allows types like { count: number } & Record<string, any>
// to still get proper intellisense for 'count'
export type PartiallyTypedObject<T> = {
  [K in keyof T]: T[K];
};
