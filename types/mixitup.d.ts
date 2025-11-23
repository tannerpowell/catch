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
    filter(selector: string): Promise<any>;
    sort(sortString: string): Promise<any>;
    destroy(): void;
    dataset(): any[];
    getState(): any;
  }

  function mixitup(container: HTMLElement | string, options?: MixItUpOptions): MixItUpInstance;

  export default mixitup;
}
