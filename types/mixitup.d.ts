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

  export interface MixItUpState {
    activeFilter: string | null;
    activeSort: string | null;
    totalShow: number;
    totalHide: number;
    hasFailed: boolean;
  }

  export interface Mixer {
    filter(selector: string): Promise<MixItUpState>;
    sort(sortString: string): Promise<MixItUpState>;
    destroy(): void;
    /** Returns currently matching elements as an array */
    dataset(): HTMLElement[];
    getState(): MixItUpState;
  }

  function mixitup(container: HTMLElement | string, options?: MixItUpOptions): Mixer;

  export default mixitup;
}
