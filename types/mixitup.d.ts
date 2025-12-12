declare module 'mixitup' {
  interface MixItUpOptions {
    selectors?: {
      target?: string;
      control?: string;
    };
    animation?: {
      duration?: number;
      effects?: string;
      easing?: string;
    };
    load?: {
      filter?: string;
      sort?: string;
    };
  }

  interface MixItUpInstance {
    filter(selector: string): Promise<unknown>;
    sort(sortString: string): Promise<unknown>;
    destroy(): void;
    dataset(): unknown[];
    getState(): unknown;
  }

  function mixitup(container: HTMLElement | string, options?: MixItUpOptions): MixItUpInstance;

  export default mixitup;
}
