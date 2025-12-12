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

  export interface Mixer {
    filter(selector: string): Promise<unknown>;
    sort(sortString: string): Promise<unknown>;
    destroy(): void;
    dataset(): unknown[];
    getState(): unknown;
  }

  function mixitup(container: HTMLElement | string, options?: MixItUpOptions): Mixer;

  export default mixitup;
}
